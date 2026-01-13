import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePixRefundTable1768200200000 implements MigrationInterface {
  name = 'CreatePixRefundTable1768200200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pix_refund',
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
            name: 'end_to_end_id_original',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'refund_reason',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'error_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'related_pix_cash_in_id',
            type: 'char',
            length: '36',
            isNullable: true,
          },
          {
            name: 'related_pix_transfer_id',
            type: 'char',
            length: '36',
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
      'pix_refund',
      new TableIndex({
        name: 'IDX_pix_refund_auth_code',
        columnNames: ['authentication_code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'pix_refund',
      new TableIndex({
        name: 'IDX_pix_refund_end_to_end_id',
        columnNames: ['end_to_end_id'],
      }),
    );
    await queryRunner.createIndex(
      'pix_refund',
      new TableIndex({
        name: 'IDX_pix_refund_end_to_end_original',
        columnNames: ['end_to_end_id_original'],
      }),
    );
    await queryRunner.createIndex(
      'pix_refund',
      new TableIndex({
        name: 'IDX_pix_refund_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('pix_refund', 'IDX_pix_refund_status');
    await queryRunner.dropIndex(
      'pix_refund',
      'IDX_pix_refund_end_to_end_original',
    );
    await queryRunner.dropIndex('pix_refund', 'IDX_pix_refund_end_to_end_id');
    await queryRunner.dropIndex('pix_refund', 'IDX_pix_refund_auth_code');
    await queryRunner.dropTable('pix_refund');
  }
}
