import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBoleto1767893771710 implements MigrationInterface {
    name = 'CreateBoleto1767893771710';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'boleto',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'external_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        comment: 'ID retornado pelo provedor financeiro',
                    },
                    {
                        name: 'alias',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        comment: 'Nome para identificar o boleto externamente',
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: ['Deposit', 'Levy'],
                        comment: 'Tipo de boleto (Deposit ou Levy)',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['Failure', 'Processing', 'Pending', 'Approved', 'Paid', 'Expired', 'Cancelled', 'Overdue'],
                        default: "'Pending'",
                        comment: 'Status atual do boleto',
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        comment: 'Valor do boleto',
                    },
                    {
                        name: 'due_date',
                        type: 'date',
                        comment: 'Data de vencimento do boleto',
                    },
                    {
                        name: 'close_payment',
                        type: 'date',
                        isNullable: true,
                        comment: 'Data limite para pagamento após vencimento',
                    },
                    {
                        name: 'document_number',
                        type: 'varchar',
                        length: '20',
                        comment: 'Número do documento (CPF ou CNPJ) do beneficiário final',
                    },
                    {
                        name: 'account_number',
                        type: 'varchar',
                        length: '50',
                        comment: 'Número da conta do beneficiário',
                    },
                    {
                        name: 'account_branch',
                        type: 'varchar',
                        length: '10',
                        comment: 'Número da agência do beneficiário',
                    },
                    {
                        name: 'payer_document',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                        comment: 'Número do documento do pagador (CPF ou CNPJ)',
                    },
                    {
                        name: 'payer_name',
                        type: 'varchar',
                        length: '60',
                        isNullable: true,
                        comment: 'Nome completo do pagador',
                    },
                    {
                        name: 'payer_trade_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                        comment: 'Nome fantasia ou comercial do pagador',
                    },
                    {
                        name: 'payer_address',
                        type: 'json',
                        isNullable: true,
                        comment: 'Endereço completo do pagador',
                    },
                    {
                        name: 'interest_start_date',
                        type: 'date',
                        isNullable: true,
                        comment: 'Data de início para cálculo dos juros',
                    },
                    {
                        name: 'interest_value',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                        comment: 'Valor dos juros',
                    },
                    {
                        name: 'interest_type',
                        type: 'enum',
                        enum: ['FixedAmount', 'Percent'],
                        isNullable: true,
                        comment: 'Tipo de regra para cálculo dos juros',
                    },
                    {
                        name: 'fine_start_date',
                        type: 'date',
                        isNullable: true,
                        comment: 'Data de início para cálculo da multa',
                    },
                    {
                        name: 'fine_value',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                        comment: 'Valor da multa',
                    },
                    {
                        name: 'fine_type',
                        type: 'enum',
                        enum: ['FixedAmount', 'Percent'],
                        isNullable: true,
                        comment: 'Tipo de regra aplicada à multa',
                    },
                    {
                        name: 'discount_limit_date',
                        type: 'date',
                        isNullable: true,
                        comment: 'Data limite para incidência de desconto',
                    },
                    {
                        name: 'discount_value',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                        comment: 'Valor do desconto',
                    },
                    {
                        name: 'discount_type',
                        type: 'enum',
                        enum: ['FixedAmountUntilLimitDate', 'FixedPercentUntilLimitDate'],
                        isNullable: true,
                        comment: 'Tipo de regra para cálculo do desconto',
                    },
                    {
                        name: 'authentication_code',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        comment: 'Código de autenticação recebido via webhook',
                    },
                    {
                        name: 'barcode',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                        comment: 'Código de barras recebido via webhook',
                    },
                    {
                        name: 'digitable',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                        comment: 'Linha digitável recebida via webhook',
                    },
                    {
                        name: 'provider_slug',
                        type: 'enum',
                        enum: ['hiperbanco'],
                        comment: 'Identificador do provedor financeiro',
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP(6)',
                        onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'deleted_at',
                        type: 'datetime',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Criar índices
        await queryRunner.createIndex(
            'boleto',
            new TableIndex({
                name: 'IDX_boleto_external_id',
                columnNames: ['external_id'],
            }),
        );

        await queryRunner.createIndex(
            'boleto',
            new TableIndex({
                name: 'IDX_boleto_status',
                columnNames: ['status'],
            }),
        );

        await queryRunner.createIndex(
            'boleto',
            new TableIndex({
                name: 'IDX_boleto_due_date',
                columnNames: ['due_date'],
            }),
        );

        await queryRunner.createIndex(
            'boleto',
            new TableIndex({
                name: 'IDX_boleto_provider_slug',
                columnNames: ['provider_slug'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('boleto');
    }
}
