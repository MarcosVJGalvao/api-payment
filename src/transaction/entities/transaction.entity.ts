import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';
import { TedTransfer } from '@/ted/entities/ted-transfer.entity';
import { TedCashIn } from '@/ted/entities/ted-cash-in.entity';
import { TedRefund } from '@/ted/entities/ted-refund.entity';

/**
 * Entidade centralizada de transações financeiras.
 * Armazena informações comuns a todas as operações para extratos e consultas.
 */
@Entity('transaction')
@Index(['authenticationCode'], { unique: true })
@Index(['accountId'])
@Index(['clientId'])
@Index(['type'])
@Index(['status'])
@Index(['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Identificador único da transação no provedor financeiro */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'authentication_code',
    comment: 'Identificador único da transação no provedor (GUID v4)',
  })
  authenticationCode: string;

  /** ID de correlação do webhook para rastreamento */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'correlation_id',
    nullable: true,
    comment: 'ID de correlação do webhook para rastreamento',
  })
  correlationId?: string;

  /** Chave de idempotência do webhook */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'idempotency_key',
    nullable: true,
    comment: 'Chave de idempotência do webhook',
  })
  idempotencyKey?: string;

  /** ID da entidade no provedor */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'entity_id',
    nullable: true,
    comment: 'entityId do webhook',
  })
  entityId?: string;

  /** Tipo de transação */
  @Column({
    type: 'enum',
    enum: TransactionType,
    comment: 'Tipo da operação financeira',
  })
  type: TransactionType;

  /** Status padronizado da transação */
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
    comment: 'Status padronizado para extratos',
  })
  status: TransactionStatus;

  /** Valor da transação */
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Valor da transação',
  })
  amount: number;

  /** Moeda (ISO 4217) */
  @Column({
    type: 'varchar',
    length: 3,
    default: 'BRL',
    comment: 'Código da moeda (ISO 4217)',
  })
  currency: string;

  /** Descrição da transação */
  @Column({
    type: 'varchar',
    length: 140,
    nullable: true,
    comment: 'Descrição da transação',
  })
  description?: string;

  // ========================================
  // Relacionamentos com entidades específicas
  // ========================================

  /** FK para PixCashIn (quando type = PIX_CASH_IN) */
  @Column({
    type: 'uuid',
    name: 'pix_cash_in_id',
    nullable: true,
    comment: 'Referência para PixCashIn',
  })
  pixCashInId?: string;

  @ManyToOne(() => PixCashIn, (pixCashIn) => pixCashIn.transactions)
  @JoinColumn({ name: 'pix_cash_in_id' })
  pixCashIn?: PixCashIn;

  /** FK para PixTransfer (quando type = PIX_CASH_OUT) */
  @Column({
    type: 'uuid',
    name: 'pix_transfer_id',
    nullable: true,
    comment: 'Referência para PixTransfer',
  })
  pixTransferId?: string;

  @ManyToOne(() => PixTransfer, (pixTransfer) => pixTransfer.transactions)
  @JoinColumn({ name: 'pix_transfer_id' })
  pixTransfer?: PixTransfer;

  /** FK para PixRefund (quando type = PIX_REFUND) */
  @Column({
    type: 'uuid',
    name: 'pix_refund_id',
    nullable: true,
    comment: 'Referência para PixRefund',
  })
  pixRefundId?: string;

  @ManyToOne(() => PixRefund, (pixRefund) => pixRefund.transactions)
  @JoinColumn({ name: 'pix_refund_id' })
  pixRefund?: PixRefund;

  /** FK para Boleto (quando type = BOLETO_CASH_IN) */
  @Column({
    type: 'uuid',
    name: 'boleto_id',
    nullable: true,
    comment: 'Referência para Boleto',
  })
  boletoId?: string;

  @ManyToOne(() => Boleto, (boleto) => boleto.transactions)
  @JoinColumn({ name: 'boleto_id' })
  boleto?: Boleto;

  /** FK para BillPayment (quando type = BILL_PAYMENT) */
  @Column({
    type: 'uuid',
    name: 'bill_payment_id',
    nullable: true,
    comment: 'Referência para BillPayment',
  })
  billPaymentId?: string;

  @ManyToOne(() => BillPayment, (billPayment) => billPayment.transactions)
  @JoinColumn({ name: 'bill_payment_id' })
  billPayment?: BillPayment;

  /** FK para PixQrCode (quando pago via QR Code) */
  @Column({
    type: 'uuid',
    name: 'pix_qr_code_id',
    nullable: true,
    comment: 'Referência para PixQrCode',
  })
  pixQrCodeId?: string;

  @ManyToOne(() => PixQrCode, (pixQrCode) => pixQrCode.transactions)
  @JoinColumn({ name: 'pix_qr_code_id' })
  pixQrCode?: PixQrCode;

  /** FK para TedTransfer (quando type = TED_OUT) */
  @Column({
    type: 'uuid',
    name: 'ted_transfer_id',
    nullable: true,
    comment: 'Referência para TedTransfer',
  })
  tedTransferId?: string;

  @ManyToOne(() => TedTransfer, (tedTransfer) => tedTransfer.transactions)
  @JoinColumn({ name: 'ted_transfer_id' })
  tedTransfer?: TedTransfer;

  /** FK para TedCashIn (quando type = TED_IN) */
  @Column({
    type: 'uuid',
    name: 'ted_cash_in_id',
    nullable: true,
    comment: 'Referência para TedCashIn',
  })
  tedCashInId?: string;

  @ManyToOne(() => TedCashIn, (tedCashIn) => tedCashIn.transactions)
  @JoinColumn({ name: 'ted_cash_in_id' })
  tedCashIn?: TedCashIn;

  /** FK para TedRefund (quando type = TED_REFUND) */
  @Column({
    type: 'uuid',
    name: 'ted_refund_id',
    nullable: true,
    comment: 'Referência para TedRefund',
  })
  tedRefundId?: string;

  @ManyToOne(() => TedRefund, (tedRefund) => tedRefund.transactions)
  @JoinColumn({ name: 'ted_refund_id' })
  tedRefund?: TedRefund;

  // ========================================
  // Relacionamentos com Account e Client
  // ========================================

  /** ID da conta associada (para extratos) */
  @Column({
    type: 'uuid',
    name: 'account_id',
    nullable: true,
    comment: 'Conta associada para extratos',
  })
  accountId?: string;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  /** ID do cliente */
  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'Cliente associado',
  })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.transactions)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  // ========================================
  // Controle de datas
  // ========================================

  /** Timestamp do webhook do provedor */
  @Column({
    type: 'datetime',
    name: 'provider_timestamp',
    nullable: true,
    comment: 'Timestamp do webhook do provedor',
  })
  providerTimestamp?: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: 'Data de criação do registro',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    comment: 'Data de atualização do registro',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    comment: 'Data de exclusão do registro',
  })
  deletedAt?: Date;
}
