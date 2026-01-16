import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '@/client/entities/client.entity';

/**
 * Entidade para histórico de eventos de webhook.
 * Registra todos os webhooks recebidos para auditoria e validação de sequência.
 * Logs com mais de 60 dias são automaticamente excluídos.
 */
@Entity('webhook_event_log')
@Index(['authenticationCode'])
@Index(['entityType', 'entityId'])
@Index(['clientId'])
@Index(['createdAt'])
export class WebhookEventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Código de autenticação da transação no provedor */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'authentication_code',
    comment: 'Código de autenticação da transação no provedor',
  })
  authenticationCode: string;

  /** Tipo da entidade (PIX_CASH_IN, BOLETO, BILL_PAYMENT, etc) */
  @Column({
    type: 'varchar',
    length: 50,
    name: 'entity_type',
    comment: 'Tipo da entidade relacionada',
  })
  entityType: string;

  /** ID da entidade relacionada */
  @Column({
    type: 'uuid',
    name: 'entity_id',
    nullable: true,
    comment: 'ID da entidade relacionada',
  })
  entityId?: string;

  /** Nome do evento de webhook */
  @Column({
    type: 'varchar',
    length: 50,
    name: 'event_name',
    comment: 'Nome do evento de webhook recebido',
  })
  eventName: string;

  /** Se o evento foi processado com sucesso */
  @Column({
    type: 'boolean',
    name: 'was_processed',
    default: true,
    comment: 'Se o evento foi processado com sucesso',
  })
  wasProcessed: boolean;

  /** Motivo se não foi processado (ex: out of sequence) */
  @Column({
    type: 'varchar',
    length: 255,
    name: 'skip_reason',
    nullable: true,
    comment: 'Motivo se não foi processado',
  })
  skipReason?: string;

  /** Payload original do webhook (JSON) */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Payload original do webhook',
  })
  payload?: Record<string, unknown>;

  /** Timestamp do provedor */
  @Column({
    type: 'datetime',
    name: 'provider_timestamp',
    nullable: true,
    comment: 'Timestamp do evento no provedor',
  })
  providerTimestamp?: Date;

  /** ID do cliente */
  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'ID do cliente proprietário',
  })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: 'Data de criação do registro',
  })
  createdAt: Date;
}
