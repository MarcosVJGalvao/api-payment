import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTransactionTable1768200000000 implements MigrationInterface {
  name = 'CreateTransactionTable1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transaction',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'authentication_code',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'correlation_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'idempotency_key',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'entity_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'PIX_CASH_IN',
              'PIX_CASH_OUT',
              'PIX_REFUND',
              'BOLETO_CASH_IN',
              'BILL_PAYMENT',
              'TED_IN',
              'TED_OUT',
            ],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'PENDING',
              'IN_PROCESS',
              'DONE',
              'UNDONE',
              'CANCELED',
              'FAILED',
              'REFUND_PENDING',
              'REFUNDED',
            ],
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '140',
            isNullable: true,
          },
          {
            name: 'pix_cash_in_id',
            type: 'char',
            length: '36',
            isNullable: true,
          },
          {
            name: 'pix_transfer_id',
            type: 'char',
            length: '36',
            isNullable: true,
          },
          {
            name: 'pix_refund_id',
            type: 'char',
            length: '36',
            isNullable: true,
          },
          {
            name: 'boleto_id',
            type: 'char',
            length: '36',
            isNullable: true,
          },
          {
            name: 'bill_payment_id',
            type: 'char',
            length: '36',
            isNullable: true,
          },
          {
            name: 'account_id',
            type: 'char',
            length: '36',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'char',
            length: '36',
            isNullable: false,
          },
          {
            name: 'provider_timestamp',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Índice único para authenticationCode
    await queryRunner.createIndex(
      'transaction',
      new TableIndex({
        name: 'IDX_transaction_authentication_code',
        columnNames: ['authentication_code'],
        isUnique: true,
      }),
    );

    // Índices para consultas
    await queryRunner.createIndex(
      'transaction',
      new TableIndex({
        name: 'IDX_transaction_account_id',
        columnNames: ['account_id'],
      }),
    );

    await queryRunner.createIndex(
      'transaction',
      new TableIndex({
        name: 'IDX_transaction_client_id',
        columnNames: ['client_id'],
      }),
    );

    await queryRunner.createIndex(
      'transaction',
      new TableIndex({
        name: 'IDX_transaction_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'transaction',
      new TableIndex({
        name: 'IDX_transaction_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'transaction',
      new TableIndex({
        name: 'IDX_transaction_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('transaction', 'IDX_transaction_created_at');
    await queryRunner.dropIndex('transaction', 'IDX_transaction_status');
    await queryRunner.dropIndex('transaction', 'IDX_transaction_type');
    await queryRunner.dropIndex('transaction', 'IDX_transaction_client_id');
    await queryRunner.dropIndex('transaction', 'IDX_transaction_account_id');
    await queryRunner.dropIndex(
      'transaction',
      'IDX_transaction_authentication_code',
    );
    await queryRunner.dropTable('transaction');
  }
}
