import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PixTransferStatus } from '../enums/pix-transfer-status.enum';
import { PixInitializationType } from '../enums/pix-initialization-type.enum';
import { PixTransactionType } from '../enums/pix-transaction-type.enum';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

@Entity('pix_transfer')
@Index(['status'])
@Index(['endToEndId'])
@Index(['transactionId'])
@Index(['providerSlug'])
export class PixTransfer extends BaseFinancialOperation {
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

  @OneToOne(() => PaymentSender, { cascade: true, eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: PaymentSender;

  @OneToOne(() => PaymentRecipient, { cascade: true, eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: PaymentRecipient;

  @Column({
    type: 'datetime',
    name: 'payment_date',
    nullable: true,
    comment: 'Data do pagamento (webhook)',
  })
  paymentDate?: Date;

  @Column({
    type: 'boolean',
    name: 'is_refund',
    default: false,
    comment: 'Indica se é devolução (MED)',
  })
  isRefund: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'end_to_end_id_original',
    nullable: true,
    comment: 'EndToEndId original (se devolução)',
  })
  endToEndIdOriginal?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'refusal_reason',
    nullable: true,
    comment: 'Motivo da recusa',
  })
  refusalReason?: string;

  @Column({
    type: 'boolean',
    name: 'is_pix_open_banking',
    default: false,
    comment: 'Transação via Open Banking',
  })
  isPixOpenBanking: boolean;

  @Column({
    type: 'boolean',
    name: 'is_internal',
    default: false,
    comment: 'Transação interna',
  })
  isInternal: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.pixTransfer)
  transactions: Transaction[];
}
