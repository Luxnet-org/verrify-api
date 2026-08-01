import { Column, Entity, Index } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { WebhookEventStatus } from '../enum/webhook-event-status.enum';
import { WebhookProvider } from '../enum/webhook-provider.enum';

@Entity()
export class WebhookEvent extends Auditable {
  @Column({ type: 'enum', enum: WebhookProvider })
  provider: WebhookProvider;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  providerEventId: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({
    type: 'enum',
    enum: WebhookEventStatus,
    default: WebhookEventStatus.RECEIVED,
  })
  status: WebhookEventStatus;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'text' })
  rawBody: string;

  @Column({ type: 'varchar', length: 128 })
  signature: string;

  @Column({ type: 'varchar', length: 64 })
  sourceIp: string;

  @Column({ type: 'integer', default: 1 })
  deliveryCount: number;

  @Column({ type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Column({ type: 'text', nullable: true })
  statusReason: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedAt: Date | null;
}
