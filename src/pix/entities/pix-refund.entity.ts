import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

/**
 * Enum de status de PIX Refund.
 */
export enum PixRefundStatus {
  RECEIVED = 'RECEIVED',
  CLEARED = 'CLEARED',
  FAILED = 'FAILED',
}

/**
 * Entidade para armazenar devoluções de PIX (refund).
 * Pode relacionar com PixCashIn (devolução de PIX recebido) ou PixTransfer (devolução de PIX enviado).
 */
@Entity('pix_refund')
@Index(['authenticationCode'], { unique: true })
@Index(['endToEndId'])
@Index(['endToEndIdOriginal'])
@Index(['status'])
export class PixRefund extends BaseFinancialOperation {
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
    enum: PixRefundStatus,
    default: PixRefundStatus.RECEIVED,
  })
  status: PixRefundStatus;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'end_to_end_id',
    nullable: true,
    comment: 'EndToEndId da devolução',
  })
  endToEndId?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'end_to_end_id_original',
    nullable: true,
    comment: 'EndToEndId da transação original',
  })
  endToEndIdOriginal?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'refund_reason',
    nullable: true,
    comment: 'Motivo: BANK_RETURN, etc',
  })
  refundReason?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'error_code',
    nullable: true,
    comment: 'Código de erro: MD06, etc',
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
    name: 'related_pix_cash_in_id',
    nullable: true,
    comment: 'FK para PixCashIn original (quando devolvemos)',
  })
  relatedPixCashInId?: string;

  @Column({
    type: 'uuid',
    name: 'related_pix_transfer_id',
    nullable: true,
    comment: 'FK para PixTransfer original (quando nos devolvem)',
  })
  relatedPixTransferId?: string;

  @OneToOne(() => PaymentSender, { cascade: true, eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: PaymentSender;

  @OneToOne(() => PaymentRecipient, { cascade: true, eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: PaymentRecipient;

  @Column({ type: 'datetime', name: 'provider_created_at', nullable: true })
  providerCreatedAt?: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.pixRefund)
  transactions: Transaction[];
}
