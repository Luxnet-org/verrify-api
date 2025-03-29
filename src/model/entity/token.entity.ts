import { User } from './user.entity';
import { Auditable } from 'src/utility/autitable.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Token extends Auditable {
  @Column({ type: 'boolean', default: true })
  valid: boolean;

  @Column({ type: 'character varying', unique: true })
  @Index('idx_refreshToken', { unique: true })
  refreshToken: string;

  @Column({ type: 'character varying' })
  ip: string;

  @Column({ type: 'character varying' })
  userAgent: string;

  @Column({ type: 'timestamp with time zone' })
  expireAt: Date;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
