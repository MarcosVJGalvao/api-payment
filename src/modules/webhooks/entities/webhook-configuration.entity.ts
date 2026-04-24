import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '@/client/entities/client.entity';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

@Entity('webhook_configuration')
@Index(['clientId'])
@Index(['clientId', 'eventType'])
@Index(['clientId', 'isActive'])
export class WebhookConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'FK para o cliente dono desta configuração',
  })
  clientId!: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'event_type',
    comment: 'Tipo de evento interno da api-payment',
  })
  eventType!: ApiPaymentWebhookEventType;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'URL de destino do cliente (deve ser HTTPS)',
  })
  url!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'public_key',
    comment: 'Chave pública enviada no header Authorization e usada na string assinada',
  })
  publicKey!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'private_key',
    select: false,
    comment: 'Segredo HMAC usado para gerar a assinatura (nunca retornado em consultas)',
  })
  privateKey!: string;

  @Column({
    type: 'boolean',
    name: 'is_active',
    default: true,
    comment: 'Apenas configurações ativas recebem eventos',
  })
  isActive!: boolean;

  @Column({
    type: 'int',
    name: 'circuit_breaker_failure_count',
    default: 0,
    comment: 'Falhas consecutivas desde o último sucesso',
  })
  circuitBreakerFailureCount!: number;

  @Column({
    type: 'datetime',
    name: 'circuit_breaker_open_until',
    nullable: true,
    comment: 'null = circuito fechado; preenchido = bloqueado até este momento',
  })
  circuitBreakerOpenUntil!: Date | null;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime' })
  deletedAt?: Date;
}
