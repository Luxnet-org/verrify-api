import {
  AmqpConnection,
  Nack,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { PaymentVerificationJobDto } from '../../model/dto/payment-verification-job.dto';
import { WebhookEventStatus } from '../../model/enum/webhook-event-status.enum';
import { EmailEvent } from '../email/email-event.service';
import {
  PAYMENT_VERIFICATION_QUEUE_GROUP,
  RABBITMQ_EXCHANGES,
  RABBITMQ_RETRY,
} from '../rabbitmq/rabbitmq.constants';
import { WebhookEventStoreService } from '../webhook/webhook-event-store.service';
import { TransactionService } from './transaction.service';

@Injectable()
export class PaymentVerificationEventService {
  private readonly logger = new Logger(PaymentVerificationEventService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly webhookEventStore: WebhookEventStoreService,
    private readonly emailEvent: EmailEvent,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async publish(job: PaymentVerificationJobDto): Promise<void> {
    await this.amqpConnection.publish(
      RABBITMQ_EXCHANGES.queue,
      PAYMENT_VERIFICATION_QUEUE_GROUP.routingKey,
      job,
    );
  }

  @RabbitSubscribe({
    queue: PAYMENT_VERIFICATION_QUEUE_GROUP.mainQueue,
    createQueueIfNotExists: false,
  })
  async handle(
    receivedJob: PaymentVerificationJobDto,
    message: ConsumeMessage,
  ): Promise<Nack | void> {
    const job = this.normalizeJob(receivedJob);
    if (!job) {
      this.logger.warn('Ignoring malformed payment verification queue job');
      return;
    }

    if (job.source === 'RECONCILIATION') {
      return this.handleReconciliation(job, message);
    }

    return this.handleWebhook(job.webhookEventId, job, message);
  }

  private async handleWebhook(
    webhookEventId: string,
    job: PaymentVerificationJobDto,
    message: ConsumeMessage,
  ): Promise<Nack | void> {
    const webhookEvent = await this.webhookEventStore.findById(webhookEventId);
    if (!webhookEvent) {
      this.logger.warn(
        `Payment verification job references missing webhook ${webhookEventId}`,
      );
      return;
    }

    if (this.webhookEventStore.isTerminal(webhookEvent.status)) {
      return;
    }

    if (webhookEvent.attemptCount >= RABBITMQ_RETRY.maxAttempts) {
      return this.deadLetterAndFail(
        webhookEvent.id,
        job,
        message,
        webhookEvent.lastError,
      );
    }

    try {
      const result =
        await this.transactionService.processPaystackWebhook(webhookEvent);

      if (result.terminalStatus === WebhookEventStatus.IGNORED) {
        await this.webhookEventStore.markIgnored(
          webhookEvent.id,
          result.reason,
        );
      } else {
        await this.webhookEventStore.markProcessed(
          webhookEvent.id,
          result.reason,
        );
      }

      if (result.receipt) {
        try {
          await this.emailEvent.sendEmailRequest(result.receipt);
        } catch (error) {
          this.logger.error(
            `Payment ${webhookEvent.id} committed, but receipt publication failed: ${this.errorMessage(error)}`,
          );
        }
      }
    } catch (error) {
      const attemptCount = await this.webhookEventStore.recordProcessingFailure(
        webhookEvent.id,
        error,
      );
      if (attemptCount < RABBITMQ_RETRY.maxAttempts) {
        this.logger.warn(
          `Payment verification failed for webhook ${webhookEvent.id}. Attempt ${attemptCount} of ${RABBITMQ_RETRY.maxAttempts}: ${this.errorMessage(error)}`,
        );
        return new Nack(false);
      }

      return this.deadLetterAndFail(
        webhookEvent.id,
        job,
        message,
        this.errorMessage(error),
      );
    }
  }

  private async handleReconciliation(
    job: Extract<PaymentVerificationJobDto, { source: 'RECONCILIATION' }>,
    message: ConsumeMessage,
  ): Promise<Nack | void> {
    try {
      const result = await this.transactionService.processPendingTransaction(
        job.transactionId,
      );
      await this.publishReceipt(result.receipt, job.transactionId);
    } catch (error) {
      const nextAttempt = job.attemptCount + 1;
      const reason = this.errorMessage(error);

      if (nextAttempt < RABBITMQ_RETRY.maxAttempts) {
        try {
          await this.amqpConnection.publish(
            RABBITMQ_EXCHANGES.retry,
            PAYMENT_VERIFICATION_QUEUE_GROUP.routingKey,
            { ...job, attemptCount: nextAttempt },
            { persistent: true, headers: message.properties.headers },
          );
          this.logger.warn(
            `Reconciliation failed for transaction ${job.transactionId}. Attempt ${nextAttempt} of ${RABBITMQ_RETRY.maxAttempts}: ${reason}`,
          );
          return;
        } catch (publicationError) {
          this.logger.error(
            `Could not publish reconciliation retry for transaction ${job.transactionId}: ${this.errorMessage(publicationError)}`,
          );
          return new Nack(false);
        }
      }

      try {
        await this.amqpConnection.publish(
          RABBITMQ_EXCHANGES.deadLetter,
          PAYMENT_VERIFICATION_QUEUE_GROUP.routingKey,
          { ...job, attemptCount: nextAttempt, lastError: reason },
          { persistent: true, headers: message.properties.headers },
        );
        this.logger.error(
          `Reconciliation exhausted for transaction ${job.transactionId}; published to ${PAYMENT_VERIFICATION_QUEUE_GROUP.deadLetterQueue}: ${reason}`,
        );
      } catch (publicationError) {
        this.logger.error(
          `Could not dead-letter reconciliation for transaction ${job.transactionId}: ${this.errorMessage(publicationError)}`,
        );
        return new Nack(false);
      }
    }
  }

  private async deadLetterAndFail(
    webhookEventId: string,
    job: PaymentVerificationJobDto,
    message: ConsumeMessage,
    reason: string | null,
  ): Promise<Nack | void> {
    const failureReason = reason || 'Payment verification attempts exhausted';
    try {
      await this.amqpConnection.publish(
        RABBITMQ_EXCHANGES.deadLetter,
        PAYMENT_VERIFICATION_QUEUE_GROUP.routingKey,
        job,
        {
          persistent: true,
          headers: message.properties.headers,
        },
      );
      await this.webhookEventStore.markFailed(webhookEventId, failureReason);
      this.logger.error(
        `Payment verification exhausted for webhook ${webhookEventId}; published to ${PAYMENT_VERIFICATION_QUEUE_GROUP.deadLetterQueue}: ${failureReason}`,
      );
    } catch (error) {
      this.logger.error(
        `Could not dead-letter payment verification webhook ${webhookEventId}: ${this.errorMessage(error)}`,
      );
      return new Nack(false);
    }
  }

  private async publishReceipt(
    receipt: Parameters<EmailEvent['sendEmailRequest']>[0] | undefined,
    paymentId: string,
  ): Promise<void> {
    if (!receipt) return;

    try {
      await this.emailEvent.sendEmailRequest(receipt);
    } catch (error) {
      this.logger.error(
        `Payment ${paymentId} committed, but receipt publication failed: ${this.errorMessage(error)}`,
      );
    }
  }

  private normalizeJob(
    job: PaymentVerificationJobDto,
  ): PaymentVerificationJobDto | null {
    if (
      job?.source === 'WEBHOOK' &&
      typeof job.webhookEventId === 'string' &&
      job.webhookEventId.length > 0
    ) {
      return job;
    }
    if (
      job?.source === 'RECONCILIATION' &&
      typeof job.transactionId === 'string' &&
      job.transactionId.length > 0 &&
      Number.isInteger(job.attemptCount) &&
      job.attemptCount >= 0
    ) {
      return job;
    }

    const legacyJob = job as unknown as { webhookEventId?: unknown };
    if (
      typeof legacyJob?.webhookEventId === 'string' &&
      legacyJob.webhookEventId.length > 0
    ) {
      return {
        source: 'WEBHOOK',
        webhookEventId: legacyJob.webhookEventId,
      };
    }
    return null;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
