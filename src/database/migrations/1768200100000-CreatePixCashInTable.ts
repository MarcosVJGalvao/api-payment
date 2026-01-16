import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePixCashInTable1768200100000 implements MigrationInterface {
  name = 'CreatePixCashInTable1768200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pix_cash_in',
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
            name: 'status',
            type: 'enum',
            enum: ['RECEIVED', 'CLEARED', 'FAILED'],
            default: "'RECEIVED'",
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
            name: 'end_to_end_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'initialization_type',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'receiver_reconciliation_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'payment_priority',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'payment_priority_type',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'payment_purpose',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'addressing_key_value',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'addressing_key_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'sender_document_type',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'sender_document_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'sender_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sender_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'sender_account_branch',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'sender_account_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'sender_account_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'sender_bank_ispb',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'sender_bank_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'recipient_document_type',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'recipient_document_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recipient_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'recipient_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recipient_account_branch',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'recipient_account_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recipient_account_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recipient_bank_ispb',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recipient_status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recipient_account_status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          { name: 'account_id', type: 'char', length: '36', isNullable: true },
          { name: 'client_id', type: 'char', length: '36', isNullable: false },
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'pix_cash_in',
      new TableIndex({
        name: 'IDX_pix_cash_in_auth_code',
        columnNames: ['authentication_code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'pix_cash_in',
      new TableIndex({
        name: 'IDX_pix_cash_in_end_to_end_id',
        columnNames: ['end_to_end_id'],
      }),
    );
    await queryRunner.createIndex(
      'pix_cash_in',
      new TableIndex({
        name: 'IDX_pix_cash_in_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'pix_cash_in',
      new TableIndex({
        name: 'IDX_pix_cash_in_account_id',
        columnNames: ['account_id'],
      }),
    );
    await queryRunner.createIndex(
      'pix_cash_in',
      new TableIndex({
        name: 'IDX_pix_cash_in_client_id',
        columnNames: ['client_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('pix_cash_in', 'IDX_pix_cash_in_client_id');
    await queryRunner.dropIndex('pix_cash_in', 'IDX_pix_cash_in_account_id');
    await queryRunner.dropIndex('pix_cash_in', 'IDX_pix_cash_in_status');
    await queryRunner.dropIndex('pix_cash_in', 'IDX_pix_cash_in_end_to_end_id');
    await queryRunner.dropIndex('pix_cash_in', 'IDX_pix_cash_in_auth_code');
    await queryRunner.dropTable('pix_cash_in');
  }
}
