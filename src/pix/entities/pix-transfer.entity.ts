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
import { PixTransferStatus } from '../enums/pix-transfer-status.enum';
import { PixInitializationType } from '../enums/pix-initialization-type.enum';
import { PixTransactionType } from '../enums/pix-transaction-type.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';
import { Exclude } from 'class-transformer';

@Entity('pix_transfer')
@Index(['status'])
@Index(['endToEndId'])
@Index(['transactionId'])
@Index(['providerSlug'])
export class PixTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PixTransferStatus,
    default: PixTransferStatus.CREATED,
    comment: 'Status da transação PIX',
  })
  status: PixTransferStatus;

  @Column({
    type: 'enum',
    enum: PixTransactionType,
    nullable: true,
    comment: 'Tipo de transação (CREDIT = Cash-In, DEBIT = Cash-Out)',
  })
  type?: PixTransactionType;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Canal (EXTERNAL, INTERNAL)',
  })
  channel?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Valor da transferência',
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 140,
    nullable: true,
    comment: 'Descrição da transferência',
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: PixInitializationType,
    name: 'initialization_type',
    comment: 'Tipo de inicialização (Key, StaticQrCode, DynamicQrCode, Manual)',
  })
  initializationType: PixInitializationType;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'end_to_end_id',
    nullable: true,
    comment: 'ID do DICT (válido por 15min)',
  })
  endToEndId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'pix_key',
    nullable: true,
    comment: 'Chave PIX do recebedor',
  })
  pixKey?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'transaction_id',
    nullable: true,
    comment: 'ID da transação retornado pelo Hiperbanco',
  })
  transactionId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'authentication_code',
    nullable: true,
    comment: 'Código de autenticação',
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
    comment: 'Chave de idempotência enviada no header',
  })
  idempotencyKey?: string;

  // ============ Sender ============
  @Column({
    type: 'varchar',
    length: 10,
    name: 'sender_document_type',
    comment: 'Tipo do documento do pagador (CPF, CNPJ)',
  })
  senderDocumentType: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_document_number',
    comment: 'Documento do pagador',
  })
  senderDocumentNumber: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'sender_name',
    comment: 'Nome do pagador',
  })
  senderName: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'sender_account_branch',
    comment: 'Agência do pagador',
  })
  senderAccountBranch: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_account_number',
    comment: 'Conta do pagador',
  })
  senderAccountNumber: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_account_type',
    comment: 'Tipo da conta do pagador',
  })
  senderAccountType: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sender_bank_ispb',
    comment: 'ISPB do banco do pagador',
  })
  senderBankIspb: string;

  // ============ Recipient ============
  @Column({
    type: 'varchar',
    length: 10,
    name: 'recipient_document_type',
    nullable: true,
    comment: 'Tipo do documento do recebedor',
  })
  recipientDocumentType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_document_number',
    nullable: true,
    comment: 'Documento do recebedor',
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
    comment: 'Tipo da conta do recebedor',
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
    length: 10,
    name: 'recipient_bank_compe',
    nullable: true,
    comment: 'Código COMPE do banco do recebedor',
  })
  recipientBankCompe?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'recipient_bank_name',
    nullable: true,
    comment: 'Nome do banco do recebedor',
  })
  recipientBankName?: string;

  // ============ Controle ============
  @Column({
    type: 'enum',
    enum: FinancialProvider,
    name: 'provider_slug',
    comment: 'Identificador do provedor financeiro',
  })
  providerSlug: FinancialProvider;

  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'ID do cliente',
  })
  @Exclude()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({
    type: 'uuid',
    name: 'account_id',
    comment: 'ID da conta pagadora',
  })
  accountId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
  })
  deletedAt?: Date;
}
