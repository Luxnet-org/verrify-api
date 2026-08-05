import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { WebhookEvent } from '../../model/entity/webhook-event.entity';
import { WebhookEventStatus } from '../../model/enum/webhook-event-status.enum';
import { WebhookProvider } from '../../model/enum/webhook-provider.enum';

export interface WebhookDeliveryInput {
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  rawBody: string;
  signature: string;
  sourceIp: string;
  isSupported: boolean;
}

@Injectable()
export class WebhookEventStoreService {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookRepository: Repository<WebhookEvent>,
  ) {}

  async persistDelivery(input: WebhookDeliveryInput): Promise<WebhookEvent> {
    const entity = this.webhookRepository.create({
      provider: WebhookProvider.PAYSTACK,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      status: input.isSupported
        ? WebhookEventStatus.RECEIVED
        : WebhookEventStatus.IGNORED,
      payload: input.payload,
      rawBody: input.rawBody,
      signature: input.signature,
      sourceIp: input.sourceIp,
      deliveryCount: 1,
      attemptCount: 0,
      lastError: null,
      statusReason: input.isSupported
        ? null
        : `Unsupported Paystack event: ${input.eventType}`,
      processedAt: input.isSupported ? null : new Date(),
    });

    try {
      return await this.webhookRepository.save(entity);
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }

      await this.webhookRepository.increment(
        { providerEventId: input.providerEventId },
        'deliveryCount',
        1,
      );
      return this.webhookRepository.findOneOrFail({
        where: { providerEventId: input.providerEventId },
      });
    }
  }

  async findById(id: string): Promise<WebhookEvent | null> {
    return this.webhookRepository.findOne({ where: { id } });
  }

  async markProcessed(id: string, reason: string): Promise<void> {
    await this.markTerminal(id, WebhookEventStatus.PROCESSED, reason);
  }

  async markIgnored(id: string, reason: string): Promise<void> {
    await this.markTerminal(id, WebhookEventStatus.IGNORED, reason);
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.markTerminal(id, WebhookEventStatus.FAILED, reason);
  }

  async recordProcessingFailure(id: string, error: unknown): Promise<number> {
    await this.webhookRepository.increment({ id }, 'attemptCount', 1);
    await this.webhookRepository.update(id, {
      lastError: this.errorMessage(error),
    });

    const event = await this.findById(id);
    return event?.attemptCount ?? 0;
  }

  async recordQueuePublicationFailure(
    id: string,
    error: unknown,
  ): Promise<void> {
    await this.webhookRepository.update(id, {
      lastError: `Queue publication failed: ${this.errorMessage(error)}`,
    });
  }

  isTerminal(status: WebhookEventStatus): boolean {
    return status !== WebhookEventStatus.RECEIVED;
  }

  private async markTerminal(
    id: string,
    status: WebhookEventStatus,
    reason: string,
  ): Promise<void> {
    await this.webhookRepository.update(
      { id, status: WebhookEventStatus.RECEIVED },
      {
        status,
        statusReason: reason,
        ...(status === WebhookEventStatus.FAILED ? { lastError: reason } : {}),
        processedAt: new Date(),
      },
    );
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === '23505'
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
