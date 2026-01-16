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
import { BillPaymentStatus } from '../enums/bill-payment-status.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';
import { Exclude } from 'class-transformer';
import { OneToMany } from 'typeorm';
import { Transaction } from '@/transaction/entities/transaction.entity';

@Entity('bill_payment')
@Index(['status'])
@Index(['dueDate'])
@Index(['providerSlug'])
export class BillPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({
    type: 'varchar',
    length: 255,
    name: 'recipient_name',
    nullable: true,
    comment: 'Nome do beneficiário',
  })
  recipientName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'recipient_document',
    nullable: true,
    comment: 'CNPJ/CPF do beneficiário',
  })
  recipientDocument?: string;

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
    comment: 'Valor efetivamente pago',
  })
  amount: number;

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
    length: 255,
    nullable: true,
    comment: 'Descrição opcional',
  })
  description?: string;

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
    comment: 'ID da conta que realizou o pagamento',
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

  // ========================================
  // Campos de webhook (BILL_PAYMENT_*)
  // ========================================

  /** ID de confirmação (WAS_CREATED) */
  @Column({
    type: 'varchar',
    length: 50,
    name: 'confirmation_transaction_id',
    nullable: true,
    comment: 'ID de confirmação da transação',
  })
  confirmationTransactionId?: string;

  /** Código de erro (HAS_FAILED) */
  @Column({
    type: 'varchar',
    length: 20,
    name: 'error_code',
    nullable: true,
    comment: 'Código de erro',
  })
  errorCode?: string;

  /** Mensagem de erro (HAS_FAILED) */
  @Column({
    type: 'varchar',
    length: 255,
    name: 'error_message',
    nullable: true,
    comment: 'Mensagem de erro',
  })
  errorMessage?: string;

  /** Motivo do cancelamento (WAS_CANCELLED) */
  @Column({
    type: 'varchar',
    length: 255,
    name: 'cancel_reason',
    nullable: true,
    comment: 'Motivo do cancelamento',
  })
  cancelReason?: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
  })
  deletedAt?: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.billPayment)
  transactions: Transaction[];
}
