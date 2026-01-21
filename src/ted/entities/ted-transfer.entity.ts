import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TedTransferStatus } from '../enums/ted-transfer-status.enum';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

/**
 * Entidade para armazenar transferências TED enviadas (cash-out).
 */
@Entity('ted_transfer')
@Index(['authenticationCode'], { unique: true })
@Index(['status'])
@Index(['providerSlug'])
@Index(['accountId'])
@Index(['clientId'])
export class TedTransfer extends BaseFinancialOperation {
  @Column({
    type: 'enum',
    enum: TedTransferStatus,
    default: TedTransferStatus.CREATED,
    comment: 'Status da transferência TED',
  })
  status: TedTransferStatus;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'authentication_code',
    nullable: true,
    comment: 'Código de autenticação retornado pelo provedor',
  })
  authenticationCode?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'correlation_id',
    nullable: true,
    comment: 'ID de correlação',
  })
  correlationId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'idempotency_key',
    nullable: true,
    comment: 'Chave de idempotência',
  })
  idempotencyKey?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'provider_transaction_id',
    nullable: true,
    comment: 'ID da transação no provedor',
  })
  providerTransactionId?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Canal (EXTERNAL, INTERNAL)',
  })
  channel?: string;

  @Column({
    type: 'datetime',
    name: 'payment_date',
    nullable: true,
    comment: 'Data do pagamento efetivo',
  })
  paymentDate?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'refusal_reason',
    nullable: true,
    comment: 'Motivo da recusa (se aplicável)',
  })
  refusalReason?: string;

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

  @OneToMany(() => Transaction, (transaction) => transaction.tedTransfer)
  transactions: Transaction[];
}
