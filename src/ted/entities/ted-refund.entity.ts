import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TedRefundStatus } from '../enums/ted-refund-status.enum';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

/**
 * Entidade para armazenar devoluções de TED (refund).
 */
@Entity('ted_refund')
@Index(['authenticationCode'], { unique: true })
@Index(['status'])
export class TedRefund extends BaseFinancialOperation {
  @Column({
    type: 'varchar',
    length: 100,
    name: 'authentication_code',
    comment: 'Identificador único da devolução',
  })
  authenticationCode: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'correlation_id',
    nullable: true,
  })
  correlationId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'idempotency_key',
    nullable: true,
  })
  idempotencyKey?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'entity_id',
    nullable: true,
  })
  entityId?: string;

  @Column({
    type: 'enum',
    enum: TedRefundStatus,
    default: TedRefundStatus.RECEIVED,
  })
  status: TedRefundStatus;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'original_authentication_code',
    nullable: true,
    comment: 'Código de autenticação da transação original',
  })
  originalAuthenticationCode?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'refund_reason',
    nullable: true,
    comment: 'Motivo da devolução',
  })
  refundReason?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'error_code',
    nullable: true,
    comment: 'Código de erro',
  })
  errorCode?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'error_reason',
    nullable: true,
    comment: 'Descrição do erro',
  })
  errorReason?: string;

  @Column({
    type: 'uuid',
    name: 'related_ted_transfer_id',
    nullable: true,
    comment: 'FK para TedTransfer original',
  })
  relatedTedTransferId?: string;

  @Column({
    type: 'uuid',
    name: 'related_ted_cash_in_id',
    nullable: true,
    comment: 'FK para TedCashIn original',
  })
  relatedTedCashInId?: string;

  @OneToOne(() => PaymentSender, { cascade: true, eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: PaymentSender;

  @OneToOne(() => PaymentRecipient, { cascade: true, eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: PaymentRecipient;

  @Column({ type: 'datetime', name: 'provider_created_at', nullable: true })
  providerCreatedAt?: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.tedRefund)
  transactions: Transaction[];
}
