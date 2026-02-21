import { Auditable } from 'src/utility/autitable.entity';
import { Column, Entity } from 'typeorm';
import { VerificationType } from '../enum/verification-type';

@Entity('action_verification')
export class ActionVerification extends Auditable {
  @Column({ type: 'character varying', unique: true })
  token: string;

  @Column({ type: 'enum', enum: VerificationType })
  verificationType: VerificationType;

  @Column({ type: 'timestamp with time zone' })
  expireAt: Date;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'character varying' })
  destination: string;
}
