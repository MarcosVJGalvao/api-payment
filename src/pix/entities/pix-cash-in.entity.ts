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
import { PixCashInStatus } from '../enums/pix-cash-in-status.enum';
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';

/**
 * Entidade para armazenar PIX recebidos (cash-in).
 * Contém todos os campos específicos do webhook PIX_CASH_IN.
 */
@Entity('pix_cash_in')
@Index(['authenticationCode'], { unique: true })
@Index(['endToEndId'])
@Index(['status'])
@Index(['accountId'])
@Index(['clientId'])
export class PixCashIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // Campos de controle do webhook
  // ========================================

  @Column({
    type: 'varchar',
    length: 100,
    name: 'authentication_code',
    comment: 'Identificador único da transação (GUID v4)',
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
    enum: PixCashInStatus,
    default: PixCashInStatus.RECEIVED,
    comment: 'Status do PIX Cash-In',
  })
  status: PixCashInStatus;

  // ========================================
  // Dados da transação
  // ========================================

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Valor da transação',
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'BRL',
    comment: 'Moeda (ISO 4217)',
  })
  currency: string;

  @Column({
    type: 'varchar',
    length: 140,
    nullable: true,
    comment: 'Descrição da transação',
  })
  description?: string;

  // ========================================
  // Dados do canal PIX
  // ========================================

  @Column({
    type: 'varchar',
    length: 50,
    name: 'end_to_end_id',
    nullable: true,
    comment: 'Identificador único da transação PIX (DICT)',
  })
  endToEndId?: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'initialization_type',
    nullable: true,
    comment: 'Tipo de inicialização: Key, StaticQrCode, DynamicQrCode, Manual',
  })
  initializationType?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'receiver_reconciliation_id',
    nullable: true,
    comment: 'ID de conciliação do recebedor (QR Code)',
  })
  receiverReconciliationId?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'payment_priority',
    nullable: true,
    comment: 'Prioridade: Priority, NonPriority',
  })
  paymentPriority?: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'payment_priority_type',
    nullable: true,
    comment:
      'Tipo de prioridade: Priority, AntifraudAnalysis, ScheduledPayment',
  })
  paymentPriorityType?: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'payment_purpose',
    nullable: true,
    comment: 'Propósito: PurchaseOrTransfer, Payment',
  })
  paymentPurpose?: string;

  // ========================================
  // Chave PIX de endereçamento
  // ========================================

  @Column({
    type: 'varchar',
    length: 100,
    name: 'addressing_key_value',
    nullable: true,
    comment: 'Valor da chave PIX',
  })
  addressingKeyValue?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'addressing_key_type',
    nullable: true,
    comment: 'Tipo: CPF, CNPJ, PHONE, EMAIL, EVP',
  })
  addressingKeyType?: string;

  // ========================================
  // Dados do pagador (Sender)
  // ========================================

  @Column({
    type: 'varchar',
    length: 10,
    name: 'sender_document_type',
    nullable: true,
    comment: 'Tipo de documento do pagador: CPF, CNPJ',
  })
  senderDocumentType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_document_number',
    nullable: true,
    comment: 'Número do documento do pagador',
  })
  senderDocumentNumber?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'sender_name',
    nullable: true,
    comment: 'Nome do pagador',
  })
  senderName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_type',
    nullable: true,
    comment: 'Tipo: Customer, Business',
  })
  senderType?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'sender_account_branch',
    nullable: true,
    comment: 'Agência do pagador',
  })
  senderAccountBranch?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_account_number',
    nullable: true,
    comment: 'Conta do pagador',
  })
  senderAccountNumber?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_account_type',
    nullable: true,
    comment: 'Tipo de conta: CHECKING, PAYMENT, SALARY, SAVINGS',
  })
  senderAccountType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_bank_ispb',
    nullable: true,
    comment: 'ISPB do banco do pagador',
  })
  senderBankIspb?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'sender_bank_name',
    nullable: true,
    comment: 'Nome do banco do pagador',
  })
  senderBankName?: string;

  // ========================================
  // Dados do recebedor (Recipient)
  // ========================================

  @Column({
    type: 'varchar',
    length: 10,
    name: 'recipient_document_type',
    nullable: true,
    comment: 'Tipo de documento do recebedor',
  })
  recipientDocumentType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_document_number',
    nullable: true,
    comment: 'Número do documento do recebedor',
  })
  recipientDocumentNumber?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'recipient_name',
    nullable: true,
    comment: 'Nome do recebedor',
  })
  recipientName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_type',
    nullable: true,
    comment: 'Tipo: Customer, Business',
  })
  recipientType?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'recipient_account_branch',
    nullable: true,
    comment: 'Agência do recebedor',
  })
  recipientAccountBranch?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_account_number',
    nullable: true,
    comment: 'Conta do recebedor',
  })
  recipientAccountNumber?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_account_type',
    nullable: true,
    comment: 'Tipo de conta',
  })
  recipientAccountType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_bank_ispb',
    nullable: true,
    comment: 'ISPB do banco do recebedor',
  })
  recipientBankIspb?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_status',
    nullable: true,
    comment: 'Status do recebedor (CLEARED)',
  })
  recipientStatus?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_account_status',
    nullable: true,
    comment: 'Status da conta do recebedor (CLEARED)',
  })
  recipientAccountStatus?: string;

  // ========================================
  // Relacionamentos
  // ========================================

  @Column({
    type: 'uuid',
    name: 'account_id',
    nullable: true,
    comment: 'Conta do recebedor',
  })
  accountId?: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'Cliente associado',
  })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  // ========================================
  // Controle de datas
  // ========================================

  @Column({
    type: 'datetime',
    name: 'provider_created_at',
    nullable: true,
    comment: 'Data de criação no provedor',
  })
  providerCreatedAt?: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
  })
  updatedAt: Date;
}
