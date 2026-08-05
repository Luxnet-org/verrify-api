import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Transaction } from '../../model/entity/transaction.entity';
import { PaymentCategory } from '../../model/enum/payment-category.enum';
import { TransactionStatus } from '../../model/enum/transaction-status.enum';
import { PaymentVerificationEventService } from './payment-verification-event.service';

const PENDING_PAYMENT_AGE_MS = 10 * 60 * 1000;

@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly paymentVerificationEvent: PaymentVerificationEventService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'pending-payment-reconciliation',
    waitForCompletion: true,
  })
  async enqueueStalePendingTransactions(): Promise<void> {
    const staleBefore = new Date(Date.now() - PENDING_PAYMENT_AGE_MS);
    const transactions = await this.transactionRepository.find({
      select: { id: true },
      where: {
        status: TransactionStatus.PENDING,
        paymentCategory: PaymentCategory.PROPERTY_VERIFICATION,
        createdAt: LessThanOrEqual(staleBefore),
      },
      order: { createdAt: 'ASC' },
    });

    for (const transaction of transactions) {
      try {
        await this.paymentVerificationEvent.publish({
          source: 'RECONCILIATION',
          transactionId: transaction.id,
          attemptCount: 0,
        });
      } catch (error) {
        this.logger.error(
          `Could not queue transaction ${transaction.id} for payment reconciliation: ${this.errorMessage(error)}`,
        );
      }
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
