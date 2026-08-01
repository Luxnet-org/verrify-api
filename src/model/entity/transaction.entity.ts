import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { TransactionStatus } from '../enum/transaction-status.enum';
import { PaymentCategory } from '../enum/payment-category.enum';
import { minorUnitMoneyTransformer } from '../../utility/money';
import { Order } from './order.entity';

@Entity()
@Index('IDX_transaction_idempotency_key', ['idempotencyKey'], {
  unique: true,
  where: '"idempotencyKey" IS NOT NULL',
})
export class Transaction extends Auditable {
  @Column({ type: 'bigint', transformer: minorUnitMoneyTransformer })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentCategory,
    default: PaymentCategory.PROPERTY_VERIFICATION,
  })
  paymentCategory: PaymentCategory;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  paystackReference: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', nullable: true })
  authorizationUrl: string;

  @Column({ type: 'varchar', nullable: true })
  accessCode: string | null;

  @Column({ type: 'text', nullable: true })
  idempotencyKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  providerTransactionId: string | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @ManyToOne(() => Order, (order) => order.transactions)
  @JoinColumn()
  order: Order;
}
