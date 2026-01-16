import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BillPaymentStatus } from '../enums/bill-payment-status.enum';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

@Entity('bill_payment')
@Index(['status'])
@Index(['dueDate'])
@Index(['providerSlug'])
export class BillPayment extends BaseFinancialOperation {
  @Column({
    type: 'enum',
    enum: BillPaymentStatus,
    default: BillPaymentStatus.CREATED,
    comment: 'Status atual do pagamento',
  })
  status: BillPaymentStatus;

  @Column({
    type: 'varchar',
    length: 60,
    comment: 'Linha digitável do título',
  })
  digitable: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'validation_id',
    nullable: true,
    comment: 'ID retornado na validação (usado para confirmar)',
  })
  validationId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'authentication_code',
    nullable: true,
    comment: 'Código de autenticação retornado na confirmação',
  })
  authenticationCode?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'transaction_id',
    nullable: true,
    comment: 'ID da transação retornado na confirmação',
  })
  transactionId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nome do cedente (ex: BANCO ITAU S.A.)',
  })
  assignor?: string;

  @OneToOne(() => PaymentRecipient, { cascade: true, eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: PaymentRecipient;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'original_amount',
    comment: 'Valor original do título',
  })
  originalAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'interest_amount',
    nullable: true,
    default: 0,
    comment: 'Valor de juros calculados',
  })
  interestAmount?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'fine_amount',
    nullable: true,
    default: 0,
    comment: 'Valor de multa calculada',
  })
  fineAmount?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'discount_amount',
    nullable: true,
    default: 0,
    comment: 'Valor de desconto',
  })
  discountAmount?: number;

  @Column({
    type: 'date',
    name: 'due_date',
    nullable: true,
    comment: 'Data de vencimento',
  })
  dueDate?: Date;

  @Column({
    type: 'datetime',
    name: 'settle_date',
    nullable: true,
    comment: 'Data de liquidação',
  })
  settleDate?: Date;

  @Column({
    type: 'datetime',
    name: 'payment_date',
    nullable: true,
    comment: 'Data do pagamento',
  })
  paymentDate?: Date;

  @Column({
    type: 'datetime',
    name: 'confirmed_at',
    nullable: true,
    comment: 'Data de confirmação',
  })
  confirmedAt?: Date;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'bank_branch',
    comment: 'Agência do pagador',
  })
  bankBranch: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'bank_account',
    comment: 'Conta do pagador',
  })
  bankAccount: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'confirmation_transaction_id',
    nullable: true,
    comment: 'ID de confirmação da transação',
  })
  confirmationTransactionId?: string;

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
    name: 'error_message',
    nullable: true,
    comment: 'Mensagem de erro',
  })
  errorMessage?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'cancel_reason',
    nullable: true,
    comment: 'Motivo do cancelamento',
  })
  cancelReason?: string;

  @OneToMany(() => Transaction, (transaction) => transaction.billPayment)
  transactions: Transaction[];
}
