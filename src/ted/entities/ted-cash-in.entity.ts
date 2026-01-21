import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TedCashInStatus } from '../enums/ted-cash-in-status.enum';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

/**
 * Entidade para armazenar TED recebidos (cash-in).
 */
@Entity('ted_cash_in')
@Index(['authenticationCode'], { unique: true })
@Index(['status'])
@Index(['accountId'])
@Index(['clientId'])
export class TedCashIn extends BaseFinancialOperation {
  @Column({
    type: 'varchar',
    length: 100,
    name: 'authentication_code',
    comment: 'Identificador único da transação',
  })
  authenticationCode: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'correlation_id',
    nullable: true,
    comment: 'ID de correlação do webhook',
  })
  correlationId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'idempotency_key',
    nullable: true,
    comment: 'Chave de idempotência do webhook',
  })
  idempotencyKey?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'entity_id',
    nullable: true,
    comment: 'entityId do webhook',
  })
  entityId?: string;

  @Column({
    type: 'enum',
    enum: TedCashInStatus,
    default: TedCashInStatus.RECEIVED,
    comment: 'Status do TED Cash-In',
  })
  status: TedCashInStatus;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'channel',
    nullable: true,
    comment: 'Canal: EXTERNAL, INTERNAL',
  })
  channel?: string;

  @OneToOne(() => PaymentSender, { cascade: true, eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: PaymentSender;

  @OneToOne(() => PaymentRecipient, { cascade: true, eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: PaymentRecipient;

  @Column({
    type: 'datetime',
    name: 'provider_created_at',
    nullable: true,
    comment: 'Data de criação no provedor',
  })
  providerCreatedAt?: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.tedCashIn)
  transactions: Transaction[];
}
