import {
    Column,
    Entity,
} from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';

@Entity()
export class VerificationPackage extends Auditable {

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0, unique: true })
    sortOrder: number;
}
