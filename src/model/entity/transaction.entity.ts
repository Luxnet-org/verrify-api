import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    Index,
} from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { TransactionStatus } from '../enum/transaction-status.enum';
import { Order } from './order.entity';

@Entity()
export class Transaction extends Auditable {

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Index({ unique: true })
    @Column({ type: 'varchar' })
    paystackReference: string;

    @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
    status: TransactionStatus;

    @ManyToOne(() => Order, (order) => order.transactions)
    @JoinColumn()
    order: Order;
}
