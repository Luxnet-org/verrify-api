import { Auditable } from 'src/utility/autitable.entity';
import { Column, Entity } from 'typeorm';
import { EmailType } from '../../email/email-type.enum';

@Entity()
export class Verification extends Auditable {
  @Column({ type: 'character varying', unique: true })
  token: string;

  @Column({ type: 'enum', enum: EmailType })
  verificationType: EmailType;

  @Column({ type: 'timestamp with time zone' })
  expireAt: Date;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'character varying' })
  destination: string;
}
