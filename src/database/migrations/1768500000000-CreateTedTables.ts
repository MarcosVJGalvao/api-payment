import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateTedTables1768500000000 implements MigrationInterface {
  name = 'CreateTedTables1768500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing tables if they exist (cleanup from partial migration)
    await queryRunner.query('DROP TABLE IF EXISTS `ted_refund`');
    await queryRunner.query('DROP TABLE IF EXISTS `ted_cash_in`');
    await queryRunner.query('DROP TABLE IF EXISTS `ted_transfer`');

    // ============ ted_transfer ============
    await queryRunner.createTable(
      new Table({
        name: 'ted_transfer',
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
            name: 'status',
            type: 'enum',
            enum: [
              'CREATED',
              'APPROVED',
              'DONE',
              'CANCELED',
              'REPROVED',
              'UNDONE',
              'FAILED',
            ],
            default: "'CREATED'",
          },
          {
            name: 'provider_slug',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          { name: 'amount', type: 'decimal', precision: 15, scale: 2 },
          { name: 'currency', type: 'varchar', length: '3', default: "'BRL'" },
          {
            name: 'description',
            type: 'varchar',
            length: '140',
            isNullable: true,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'scheduled_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'payment_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'refusal_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sender_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            collation: 'utf8mb4_unicode_ci',
          },
          {
            name: 'recipient_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            collation: 'utf8mb4_unicode_ci',
          },
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'provider_created_at', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
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

    await queryRunner.createIndex(
      'ted_transfer',
      new TableIndex({
        name: 'IDX_ted_transfer_auth_code',
        columnNames: ['authentication_code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'ted_transfer',
      new TableIndex({
        name: 'IDX_ted_transfer_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'ted_transfer',
      new TableIndex({
        name: 'IDX_ted_transfer_account_id',
        columnNames: ['account_id'],
      }),
    );
    await queryRunner.createIndex(
      'ted_transfer',
      new TableIndex({
        name: 'IDX_ted_transfer_client_id',
        columnNames: ['client_id'],
      }),
    );

    // ============ ted_cash_in ============
    await queryRunner.createTable(
      new Table({
        name: 'ted_cash_in',
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
            name: 'status',
            type: 'enum',
            enum: ['RECEIVED', 'CLEARED', 'FAILED'],
            default: "'RECEIVED'",
          },
          {
            name: 'provider_slug',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          { name: 'amount', type: 'decimal', precision: 15, scale: 2 },
          { name: 'currency', type: 'varchar', length: '3', default: "'BRL'" },
          {
            name: 'description',
            type: 'varchar',
            length: '140',
            isNullable: true,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'sender_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            collation: 'utf8mb4_unicode_ci',
          },
          {
            name: 'recipient_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            collation: 'utf8mb4_unicode_ci',
          },
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'provider_created_at', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
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

    await queryRunner.createIndex(
      'ted_cash_in',
      new TableIndex({
        name: 'IDX_ted_cash_in_auth_code',
        columnNames: ['authentication_code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'ted_cash_in',
      new TableIndex({
        name: 'IDX_ted_cash_in_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'ted_cash_in',
      new TableIndex({
        name: 'IDX_ted_cash_in_account_id',
        columnNames: ['account_id'],
      }),
    );
    await queryRunner.createIndex(
      'ted_cash_in',
      new TableIndex({
        name: 'IDX_ted_cash_in_client_id',
        columnNames: ['client_id'],
      }),
    );

    // ============ ted_refund ============
    await queryRunner.createTable(
      new Table({
        name: 'ted_refund',
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
            name: 'status',
            type: 'enum',
            enum: ['RECEIVED', 'CLEARED', 'FAILED'],
            default: "'RECEIVED'",
          },
          {
            name: 'provider_slug',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          { name: 'amount', type: 'decimal', precision: 15, scale: 2 },
          { name: 'currency', type: 'varchar', length: '3', default: "'BRL'" },
          {
            name: 'description',
            type: 'varchar',
            length: '140',
            isNullable: true,
          },
          {
            name: 'original_authentication_code',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'refund_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'error_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'related_ted_transfer_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'related_ted_cash_in_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'sender_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            collation: 'utf8mb4_unicode_ci',
          },
          {
            name: 'recipient_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            collation: 'utf8mb4_unicode_ci',
          },
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'provider_created_at', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
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

    await queryRunner.createIndex(
      'ted_refund',
      new TableIndex({
        name: 'IDX_ted_refund_auth_code',
        columnNames: ['authentication_code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'ted_refund',
      new TableIndex({
        name: 'IDX_ted_refund_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'ted_refund',
      new TableIndex({
        name: 'IDX_ted_refund_account_id',
        columnNames: ['account_id'],
      }),
    );
    await queryRunner.createIndex(
      'ted_refund',
      new TableIndex({
        name: 'IDX_ted_refund_client_id',
        columnNames: ['client_id'],
      }),
    );

    // ============ Add TED columns to transaction table ============
    const transactionTable = await queryRunner.getTable('transaction');

    if (
      transactionTable &&
      !transactionTable.columns.find((c) => c.name === 'ted_transfer_id')
    ) {
      await queryRunner.addColumn(
        'transaction',
        new TableColumn({
          name: 'ted_transfer_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    if (
      transactionTable &&
      !transactionTable.columns.find((c) => c.name === 'ted_cash_in_id')
    ) {
      await queryRunner.addColumn(
        'transaction',
        new TableColumn({
          name: 'ted_cash_in_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    if (
      transactionTable &&
      !transactionTable.columns.find((c) => c.name === 'ted_refund_id')
    ) {
      await queryRunner.addColumn(
        'transaction',
        new TableColumn({
          name: 'ted_refund_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    // ============ Foreign Keys ============
    await queryRunner.createForeignKey(
      'ted_transfer',
      new TableForeignKey({
        columnNames: ['sender_id'],
        referencedTableName: 'payment_sender',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_transfer_sender',
      }),
    );

    await queryRunner.createForeignKey(
      'ted_transfer',
      new TableForeignKey({
        columnNames: ['recipient_id'],
        referencedTableName: 'payment_recipient',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_transfer_recipient',
      }),
    );

    await queryRunner.createForeignKey(
      'ted_cash_in',
      new TableForeignKey({
        columnNames: ['sender_id'],
        referencedTableName: 'payment_sender',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_cash_in_sender',
      }),
    );

    await queryRunner.createForeignKey(
      'ted_cash_in',
      new TableForeignKey({
        columnNames: ['recipient_id'],
        referencedTableName: 'payment_recipient',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_cash_in_recipient',
      }),
    );

    await queryRunner.createForeignKey(
      'ted_refund',
      new TableForeignKey({
        columnNames: ['sender_id'],
        referencedTableName: 'payment_sender',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_refund_sender',
      }),
    );

    await queryRunner.createForeignKey(
      'ted_refund',
      new TableForeignKey({
        columnNames: ['recipient_id'],
        referencedTableName: 'payment_recipient',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_refund_recipient',
      }),
    );

    await queryRunner.createForeignKey(
      'ted_refund',
      new TableForeignKey({
        columnNames: ['related_ted_transfer_id'],
        referencedTableName: 'ted_transfer',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_refund_transfer',
      }),
    );

    await queryRunner.createForeignKey(
      'ted_refund',
      new TableForeignKey({
        columnNames: ['related_ted_cash_in_id'],
        referencedTableName: 'ted_cash_in',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ted_refund_cash_in',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs
    await queryRunner.dropForeignKey('ted_refund', 'FK_ted_refund_cash_in');
    await queryRunner.dropForeignKey('ted_refund', 'FK_ted_refund_transfer');
    await queryRunner.dropForeignKey('ted_refund', 'FK_ted_refund_recipient');
    await queryRunner.dropForeignKey('ted_refund', 'FK_ted_refund_sender');
    await queryRunner.dropForeignKey('ted_cash_in', 'FK_ted_cash_in_recipient');
    await queryRunner.dropForeignKey('ted_cash_in', 'FK_ted_cash_in_sender');
    await queryRunner.dropForeignKey(
      'ted_transfer',
      'FK_ted_transfer_recipient',
    );
    await queryRunner.dropForeignKey('ted_transfer', 'FK_ted_transfer_sender');

    // Drop transaction columns
    const transactionTable = await queryRunner.getTable('transaction');
    if (transactionTable?.columns.find((c) => c.name === 'ted_refund_id')) {
      await queryRunner.dropColumn('transaction', 'ted_refund_id');
    }
    if (transactionTable?.columns.find((c) => c.name === 'ted_cash_in_id')) {
      await queryRunner.dropColumn('transaction', 'ted_cash_in_id');
    }
    if (transactionTable?.columns.find((c) => c.name === 'ted_transfer_id')) {
      await queryRunner.dropColumn('transaction', 'ted_transfer_id');
    }

    // Drop indexes and tables
    await queryRunner.dropIndex('ted_refund', 'IDX_ted_refund_client_id');
    await queryRunner.dropIndex('ted_refund', 'IDX_ted_refund_account_id');
    await queryRunner.dropIndex('ted_refund', 'IDX_ted_refund_status');
    await queryRunner.dropIndex('ted_refund', 'IDX_ted_refund_auth_code');
    await queryRunner.dropTable('ted_refund');

    await queryRunner.dropIndex('ted_cash_in', 'IDX_ted_cash_in_client_id');
    await queryRunner.dropIndex('ted_cash_in', 'IDX_ted_cash_in_account_id');
    await queryRunner.dropIndex('ted_cash_in', 'IDX_ted_cash_in_status');
    await queryRunner.dropIndex('ted_cash_in', 'IDX_ted_cash_in_auth_code');
    await queryRunner.dropTable('ted_cash_in');

    await queryRunner.dropIndex('ted_transfer', 'IDX_ted_transfer_client_id');
    await queryRunner.dropIndex('ted_transfer', 'IDX_ted_transfer_account_id');
    await queryRunner.dropIndex('ted_transfer', 'IDX_ted_transfer_status');
    await queryRunner.dropIndex('ted_transfer', 'IDX_ted_transfer_auth_code');
    await queryRunner.dropTable('ted_transfer');
  }
}
