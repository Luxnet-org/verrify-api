import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PaymentVerificationEventService } from '../payment/payment-verification-event.service';
import { PaystackService } from '../payment/paystack/paystack.service';
import { WebhookEventStoreService } from './webhook-event-store.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly webhookEventStore: WebhookEventStoreService,
    private readonly paymentVerificationEvent: PaymentVerificationEventService,
    private readonly paystackService: PaystackService,
  ) {}

  async receivePaystackWebhook(
    rawBody: Buffer,
    signature: string,
    sourceIp: string,
  ): Promise<void> {
    const paystackWebhook = this.paystackService.parseWebhook(
      rawBody,
      signature,
      sourceIp,
    );
    const webhookEvent =
      await this.webhookEventStore.persistDelivery(paystackWebhook);

    if (
      !paystackWebhook.isSupported ||
      this.webhookEventStore.isTerminal(webhookEvent.status)
    ) {
      return;
    }

    try {
      await this.paymentVerificationEvent.publish({
        source: 'WEBHOOK',
        webhookEventId: webhookEvent.id,
      });
    } catch (error) {
      const errorMessage = this.errorMessage(error);
      await this.webhookEventStore.recordQueuePublicationFailure(
        webhookEvent.id,
        error,
      );
      this.logger.error(
        `Failed to publish webhook ${webhookEvent.id} for payment verification: ${errorMessage}`,
      );
      throw new InternalServerErrorException(
        'Failed to queue Paystack webhook for processing',
      );
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
