import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { ConfigInterface } from '../../../config-module/configuration';
import { PaystackVerificationDataDto } from '../../../model/dto/paystack-verification-data.dto';
import { PaystackVerificationResultDto } from '../../../model/dto/paystack-verification-result.dto';
import { PaystackWebhookDto } from '../../../model/dto/paystack-webhook.dto';
import { PaystackInitializeRequestDto } from '../../../model/request/paystack-initialize-request.dto';
import { PaystackResponseDto } from '../../../model/response/paystack-response.dto';
import {
  generatePaystackProviderEventId,
  isSupportedPaystackEvent,
  normalizeHttpIpAddress,
  normalizePaystackVerificationData,
  PAYSTACK_WEBHOOK_IPS,
} from '../../../utility/paystack-utility';
import { parseStringPreservingJson } from '../../../utility/string-preserving-json';
import { RetryablePaystackException } from '../../../exception/retryable-paystack.exception';

const PAYSTACK_API_URL = 'https://api.paystack.co';

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly domain: 'test' | 'live';
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService<ConfigInterface>,
  ) {
    const config = configService.get('paystack', { infer: true });
    if (!config) {
      throw new Error('Paystack configuration is missing');
    }
    this.secretKey = config.secretKey;
    this.domain = config.domain;
    this.timeoutMs = config.timeoutMs;
  }

  async initializeTransaction(
    request: PaystackInitializeRequestDto,
  ): Promise<Record<string, string>> {
    let response: AxiosResponse<string>;
    try {
      response = await firstValueFrom(
        this.httpService.post<string>(
          `${PAYSTACK_API_URL}/transaction/initialize`,
          {
            email: request.email,
            amount: request.amount,
            currency: request.currency,
            reference: request.reference,
            metadata: { orderId: request.orderId },
          },
          {
            headers: this.headers(true),
            timeout: this.timeoutMs,
            responseType: 'text',
            transformResponse: [(value: string): string => value],
          },
        ),
      );
    } catch (error) {
      throw new Error(
        `Paystack initialization request failed: ${this.errorMessage(error)}`,
      );
    }

    const payload = this.parseResponse<Record<string, string>>(
      response.data,
      'initialization',
    );
    if (!payload.status || !payload.data) {
      throw new Error(
        payload.message || 'Paystack initialization was rejected',
      );
    }
    if (payload.data.reference !== request.reference) {
      throw new Error(
        'Paystack initialization returned an unexpected transaction reference',
      );
    }
    if (!payload.data.authorization_url || !payload.data.access_code) {
      throw new Error(
        'Paystack initialization response is missing checkout details',
      );
    }
    return payload.data;
  }

  async verifyTransaction(
    reference: string,
  ): Promise<PaystackVerificationResultDto> {
    let response: AxiosResponse<string>;
    try {
      response = await firstValueFrom(
        this.httpService.get<string>(
          `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`,
          {
            headers: this.headers(),
            timeout: this.timeoutMs,
            responseType: 'text',
            transformResponse: [(value: string): string => value],
            validateStatus: () => true,
          },
        ),
      );
    } catch (error) {
      throw new RetryablePaystackException(
        `Paystack verification request failed: ${this.errorMessage(error)}`,
      );
    }

    if (response.status >= 500) {
      throw new RetryablePaystackException(
        `Paystack verification returned HTTP ${response.status}`,
      );
    }

    let payload: PaystackResponseDto<PaystackVerificationDataDto>;
    try {
      payload = this.parseResponse<PaystackVerificationDataDto>(
        response.data,
        'verification',
      );
    } catch (error) {
      throw new RetryablePaystackException(this.errorMessage(error));
    }

    if (response.status >= 400 || !payload.status || !payload.data) {
      return {
        data: null,
        rejectionReason:
          payload.message ||
          `Paystack verification returned HTTP ${response.status}`,
      };
    }

    const data = normalizePaystackVerificationData(payload.data);
    if (data.domain?.toLowerCase() !== this.domain) {
      return {
        data: null,
        rejectionReason: `Paystack domain ${data.domain || 'missing'} does not match ${this.domain}`,
      };
    }

    return { data, rejectionReason: null };
  }

  parseWebhook(
    rawBody: Buffer,
    signature: string,
    sourceIp: string,
  ): PaystackWebhookDto {
    const normalizedIp = normalizeHttpIpAddress(sourceIp);
    if (!PAYSTACK_WEBHOOK_IPS.has(normalizedIp)) {
      throw new UnauthorizedException('Unrecognized Paystack source IP');
    }
    if (!this.hasValidSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }

    const rawBodyText = rawBody.toString('utf8');
    const payload = this.parseWebhookPayload(rawBodyText);
    const eventType = payload.event;
    if (typeof eventType !== 'string' || eventType.length === 0) {
      throw new BadRequestException('Paystack event type is missing');
    }

    return {
      providerEventId: generatePaystackProviderEventId(eventType, rawBody),
      eventType,
      payload,
      rawBody: rawBodyText,
      signature,
      sourceIp: normalizedIp,
      isSupported: isSupportedPaystackEvent(eventType),
    };
  }

  private headers(includeContentType = false): Record<string, string> {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    };
  }

  private parseResponse<T>(
    rawResponse: string,
    operation: string,
  ): PaystackResponseDto<T> {
    try {
      return parseStringPreservingJson<PaystackResponseDto<T>>(rawResponse);
    } catch (error) {
      throw new Error(
        `Paystack ${operation} returned invalid JSON: ${this.errorMessage(error)}`,
      );
    }
  }

  private parseWebhookPayload(rawBody: string): Record<string, unknown> {
    try {
      const payload = parseStringPreservingJson<unknown>(rawBody);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Payload must be a JSON object');
      }
      return payload as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Invalid Paystack JSON payload');
    }
  }

  private hasValidSignature(rawBody: Buffer, signature: string): boolean {
    if (!/^[a-f\d]{128}$/i.test(signature)) {
      return false;
    }
    const expected = createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest();
    const received = Buffer.from(signature, 'hex');
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
