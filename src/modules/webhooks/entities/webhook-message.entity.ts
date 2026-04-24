import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';
import { WebhookConfiguration } from './webhook-configuration.entity';
import type { OutboundWebhookPayload } from '../interfaces/outbound-webhook-payload.interface';

@Entity('webhook_message')
@Index(['configurationId'])
@Index(['clientId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['providerEventName'])
export class WebhookMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    name: 'configuration_id',
    comment: 'FK para webhook_configuration',
  })
  configurationId!: string;

  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'Desnormalizado para consultas rápidas',
  })
  clientId!: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'event_type',
    comment: 'Evento interno da api-payment',
  })
  eventType!: ApiPaymentWebhookEventType;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'provider_event_name',
    comment: 'Valor original do WebhookEvent enum do provider',
  })
  providerEventName!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'provider_slug',
    comment: 'Identificador do provider financeiro',
  })
  providerSlug!: string;

  @Column({
    type: 'json',
    comment: 'Array completo do payload enviado ao cliente',
  })
  payload!: OutboundWebhookPayload[];

  @Column({
    type: 'varchar',
    length: 50,
    default: OutboundWebhookMessageStatus.PENDING,
    comment: 'Estado atual da mensagem',
  })
  status!: OutboundWebhookMessageStatus;

  @Column({
    type: 'int',
    name: 'attempt_count',
    default: 0,
    comment: 'Número de tentativas de entrega realizadas',
  })
  attemptCount!: number;

  @Column({
    type: 'datetime',
    name: 'last_attempted_at',
    nullable: true,
  })
  lastAttemptedAt!: Date | null;

  @Column({
    type: 'datetime',
    name: 'delivered_at',
    nullable: true,
  })
  deliveredAt!: Date | null;

  @Column({
    type: 'text',
    name: 'last_error',
    nullable: true,
    comment: 'Última mensagem de erro na entrega',
  })
  lastError!: string | null;

  @Column({
    type: 'int',
    name: 'response_status_code',
    nullable: true,
    comment: 'HTTP status code da última tentativa',
  })
  responseStatusCode!: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'correlation_id',
    nullable: true,
  })
  correlationId!: string | null;

  @ManyToOne(() => WebhookConfiguration)
  @JoinColumn({ name: 'configuration_id' })
  configuration!: WebhookConfiguration;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
