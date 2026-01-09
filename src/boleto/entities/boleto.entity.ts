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
import { BoletoStatus } from '../enums/boleto-status.enum';
import { BoletoType } from '../enums/boleto-type.enum';
import { InterestType } from '../enums/interest-type.enum';
import { FineType } from '../enums/fine-type.enum';
import { DiscountType } from '../enums/discount-type.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';
import { Exclude } from 'class-transformer';

@Entity('boleto')
@Index(['status'])
@Index(['dueDate'])
@Index(['providerSlug'])
export class Boleto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: 'Valor do boleto',
    })
    amount: number;

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

    @Column({
        type: 'varchar',
        length: 20,
        name: 'payer_document',
        nullable: true,
        comment: 'Número do documento do pagador (CPF ou CNPJ)',
    })
    payerDocument?: string;

    @Column({
        type: 'varchar',
        length: 60,
        name: 'payer_name',
        nullable: true,
        comment: 'Nome completo do pagador',
    })
    payerName?: string;

    @Column({
        type: 'varchar',
        length: 100,
        name: 'payer_trade_name',
        nullable: true,
        comment: 'Nome fantasia ou comercial do pagador',
    })
    payerTradeName?: string;

    @Column({
        type: 'json',
        name: 'payer_address',
        nullable: true,
        comment: 'Endereço completo do pagador (JSON)',
    })
    payerAddress?: {
        zipCode: string;
        addressLine: string;
        neighborhood: string;
        city: string;
        state: string;
    };

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
        comment: 'ID da conta que emitiu o boleto',
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
