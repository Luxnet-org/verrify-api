import { Column, Entity } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { minorUnitMoneyTransformer } from '../../utility/money';

@Entity()
export class VerificationPackage extends Auditable {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'bigint', transformer: minorUnitMoneyTransformer })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0, unique: true })
  sortOrder: number;
}
