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
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';
import { OneToMany } from 'typeorm';
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
export class PixRefund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // Campos de controle do webhook
  // ========================================

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

  // ========================================
  // Dados da transação
  // ========================================

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'BRL',
  })
  currency: string;

  @Column({
    type: 'varchar',
    length: 140,
    nullable: true,
  })
  description?: string;

  // ========================================
  // Dados específicos de refund
  // ========================================

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

  // ========================================
  // Relacionamentos com transação original
  // ========================================

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

  // ========================================
  // Dados do pagador (Sender)
  // ========================================

  @Column({
    type: 'varchar',
    length: 10,
    name: 'sender_document_type',
    nullable: true,
  })
  senderDocumentType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_document_number',
    nullable: true,
  })
  senderDocumentNumber?: string;

  @Column({ type: 'varchar', length: 255, name: 'sender_name', nullable: true })
  senderName?: string;

  @Column({ type: 'varchar', length: 20, name: 'sender_type', nullable: true })
  senderType?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'sender_account_branch',
    nullable: true,
  })
  senderAccountBranch?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_account_number',
    nullable: true,
  })
  senderAccountNumber?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_account_type',
    nullable: true,
  })
  senderAccountType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_bank_ispb',
    nullable: true,
  })
  senderBankIspb?: string;

  // ========================================
  // Dados do recebedor (Recipient)
  // ========================================

  @Column({
    type: 'varchar',
    length: 10,
    name: 'recipient_document_type',
    nullable: true,
  })
  recipientDocumentType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_document_number',
    nullable: true,
  })
  recipientDocumentNumber?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'recipient_name',
    nullable: true,
  })
  recipientName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_type',
    nullable: true,
  })
  recipientType?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'recipient_account_branch',
    nullable: true,
  })
  recipientAccountBranch?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_account_number',
    nullable: true,
  })
  recipientAccountNumber?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_account_type',
    nullable: true,
  })
  recipientAccountType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_bank_ispb',
    nullable: true,
  })
  recipientBankIspb?: string;

  // ========================================
  // Relacionamentos
  // ========================================

  @Column({ type: 'uuid', name: 'account_id', nullable: true })
  accountId?: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  // ========================================
  // Datas
  // ========================================

  @Column({ type: 'datetime', name: 'provider_created_at', nullable: true })
  providerCreatedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.pixRefund)
  transactions: Transaction[];
}
