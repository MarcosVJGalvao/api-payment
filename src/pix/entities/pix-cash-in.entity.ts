import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PixCashInStatus } from '../enums/pix-cash-in-status.enum';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

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
export class PixCashIn extends BaseFinancialOperation {
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

  // created_at, updated_at inherited

  @OneToMany(() => Transaction, (transaction) => transaction.pixCashIn)
  transactions: Transaction[];
}
