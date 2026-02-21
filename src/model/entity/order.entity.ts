import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { OrderStatus } from '../enum/order-status.enum';
import { PropertyVerification } from './property-verification.entity';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class Order extends Auditable {

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', default: 'NGN' })
    currency: string;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User;

    @ManyToOne(() => PropertyVerification)
    @JoinColumn()
    propertyVerification: PropertyVerification;

    @OneToMany(() => Transaction, (transaction) => transaction.order)
    transactions: Transaction[];
}
