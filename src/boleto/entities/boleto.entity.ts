import {
  Entity,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BoletoStatus } from '../enums/boleto-status.enum';
import { BoletoType } from '../enums/boleto-type.enum';
import { InterestType } from '../enums/interest-type.enum';
import { FineType } from '../enums/fine-type.enum';
import { DiscountType } from '../enums/discount-type.enum';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { BoletoPayer } from '@/boleto/entities/boleto-payer.entity';
import { Transaction } from '@/transaction/entities/transaction.entity';

@Entity('boleto')
@Index(['status'])
@Index(['dueDate'])
@Index(['providerSlug'])
export class Boleto extends BaseFinancialOperation {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nome para identificar o boleto externamente',
  })
  alias?: string;

  @Column({
    type: 'enum',
    enum: BoletoType,
    comment: 'Tipo de boleto (Deposit ou Levy)',
  })
  type: BoletoType;

  @Column({
    type: 'enum',
    enum: BoletoStatus,
    default: BoletoStatus.PENDING,
    comment: 'Status atual do boleto',
  })
  status: BoletoStatus;

  @Column({
    type: 'date',
    name: 'due_date',
    comment: 'Data de vencimento do boleto',
  })
  dueDate: Date;

  @Column({
    type: 'date',
    name: 'close_payment',
    nullable: true,
    comment: 'Data limite para pagamento após vencimento',
  })
  closePayment?: Date;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'document_number',
    comment: 'Número do documento (CPF ou CNPJ) do beneficiário final',
  })
  documentNumber: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'account_number',
    comment: 'Número da conta do beneficiário',
  })
  accountNumber: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'account_branch',
    comment: 'Número da agência do beneficiário',
  })
  accountBranch: string;

  @OneToOne(() => BoletoPayer, { cascade: true, eager: true })
  @JoinColumn({ name: 'payer_id' })
  payer: BoletoPayer;

  @Column({
    type: 'date',
    name: 'interest_start_date',
    nullable: true,
    comment: 'Data de início para cálculo dos juros',
  })
  interestStartDate?: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'interest_value',
    nullable: true,
    comment: 'Valor dos juros',
  })
  interestValue?: number;

  @Column({
    type: 'enum',
    enum: InterestType,
    name: 'interest_type',
    nullable: true,
    comment: 'Tipo de regra para cálculo dos juros',
  })
  interestType?: InterestType;

  @Column({
    type: 'date',
    name: 'fine_start_date',
    nullable: true,
    comment: 'Data de início para cálculo da multa',
  })
  fineStartDate?: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'fine_value',
    nullable: true,
    comment: 'Valor da multa',
  })
  fineValue?: number;

  @Column({
    type: 'enum',
    enum: FineType,
    name: 'fine_type',
    nullable: true,
    comment: 'Tipo de regra aplicada à multa',
  })
  fineType?: FineType;

  @Column({
    type: 'date',
    name: 'discount_limit_date',
    nullable: true,
    comment: 'Data limite para incidência de desconto',
  })
  discountLimitDate?: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'discount_value',
    nullable: true,
    comment: 'Valor do desconto',
  })
  discountValue?: number;

  @Column({
    type: 'enum',
    enum: DiscountType,
    name: 'discount_type',
    nullable: true,
    comment: 'Tipo de regra para cálculo do desconto',
  })
  discountType?: DiscountType;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'authentication_code',
    nullable: true,
    comment: 'Código de autenticação recebido via webhook',
  })
  authenticationCode?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Código de barras recebido via webhook',
  })
  barcode?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Linha digitável recebida via webhook',
  })
  digitable?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'our_number',
    nullable: true,
    comment: 'Número do nosso número do boleto',
  })
  ourNumber?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment:
      'Array de pagamentos do boleto recebido do Hiperbanco (pode ser null por muito tempo)',
  })
  payments?: Array<{
    id: string;
    amount: number;
    paymentChannel: string;
    paidOutDate: string;
  }> | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'cancel_reason',
    nullable: true,
    comment: 'Motivo: CancelledByRecipient, CancelledByDeadLine',
  })
  cancelReason?: string;

  @OneToMany(() => Transaction, (transaction) => transaction.boleto)
  transactions: Transaction[];
}
