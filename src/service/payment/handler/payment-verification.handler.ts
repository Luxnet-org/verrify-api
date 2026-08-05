import { EntityManager } from 'typeorm';
import { Transaction } from '../../../model/entity/transaction.entity';
import { PaymentCategory } from '../../../model/enum/payment-category.enum';

export interface PaymentVerificationHandler {
  readonly category: PaymentCategory;

  handle(manager: EntityManager, transaction: Transaction): Promise<void>;
}
