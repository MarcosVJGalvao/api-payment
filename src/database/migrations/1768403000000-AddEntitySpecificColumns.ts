import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEntitySpecificColumns1768403000000 implements MigrationInterface {
  name = 'AddEntitySpecificColumns1768403000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // PixCashIn specific columns
    // ========================================
    const pixCashInColumns = [
      { name: 'entity_id', type: 'varchar', length: '100' },
      { name: 'initialization_type', type: 'varchar', length: '30' },
      { name: 'receiver_reconciliation_id', type: 'varchar', length: '100' },
      { name: 'payment_priority', type: 'varchar', length: '20' },
      { name: 'payment_priority_type', type: 'varchar', length: '30' },
      { name: 'payment_purpose', type: 'varchar', length: '30' },
      { name: 'addressing_key_value', type: 'varchar', length: '100' },
      { name: 'addressing_key_type', type: 'varchar', length: '20' },
      { name: 'sender_type', type: 'varchar', length: '20' },
      { name: 'sender_bank_name', type: 'varchar', length: '255' },
      { name: 'recipient_type', type: 'varchar', length: '20' },
      { name: 'recipient_status', type: 'varchar', length: '20' },
      { name: 'recipient_account_status', type: 'varchar', length: '20' },
      { name: 'provider_created_at', type: 'datetime', length: undefined },
    ];

    for (const col of pixCashInColumns) {
      const hasColumn = await queryRunner.hasColumn('pix_cash_in', col.name);
      if (!hasColumn) {
        await queryRunner.addColumn(
          'pix_cash_in',
          new TableColumn({
            name: col.name,
            type: col.type,
            length: col.length,
            isNullable: true,
          }),
        );
      }
    }

    // ========================================
    // PixRefund specific columns
    // ========================================
    const pixRefundColumns = [
      { name: 'entity_id', type: 'varchar', length: '100' },
      { name: 'refund_reason', type: 'varchar', length: '50' },
      { name: 'error_code', type: 'varchar', length: '20' },
      { name: 'error_reason', type: 'varchar', length: '255' },
      { name: 'related_pix_cash_in_id', type: 'varchar', length: '36' },
      { name: 'related_pix_transfer_id', type: 'varchar', length: '36' },
      { name: 'sender_type', type: 'varchar', length: '20' },
      { name: 'recipient_type', type: 'varchar', length: '20' },
      { name: 'provider_created_at', type: 'datetime', length: undefined },
    ];

    for (const col of pixRefundColumns) {
      const hasColumn = await queryRunner.hasColumn('pix_refund', col.name);
      if (!hasColumn) {
        await queryRunner.addColumn(
          'pix_refund',
          new TableColumn({
            name: col.name,
            type: col.type,
            length: col.length,
            isNullable: true,
          }),
        );
      }
    }

    // ========================================
    // PixTransfer specific columns
    // ========================================
    const pixTransferColumns = [
      { name: 'type', type: 'varchar', length: '20' },
      { name: 'channel', type: 'varchar', length: '20' },
      { name: 'pix_key', type: 'varchar', length: '100' },
      { name: 'transaction_id', type: 'varchar', length: '100' },
      { name: 'authentication_code', type: 'varchar', length: '100' },
      { name: 'correlation_id', type: 'varchar', length: '100' },
      { name: 'idempotency_key', type: 'varchar', length: '100' },
      { name: 'payment_date', type: 'datetime', length: undefined },
      { name: 'is_refund', type: 'tinyint', length: '1' },
      { name: 'end_to_end_id_original', type: 'varchar', length: '50' },
      { name: 'refusal_reason', type: 'varchar', length: '255' },
      { name: 'is_pix_open_banking', type: 'tinyint', length: '1' },
      { name: 'is_internal', type: 'tinyint', length: '1' },
    ];

    for (const col of pixTransferColumns) {
      const hasColumn = await queryRunner.hasColumn('pix_transfer', col.name);
      if (!hasColumn) {
        await queryRunner.addColumn(
          'pix_transfer',
          new TableColumn({
            name: col.name,
            type: col.type,
            length: col.length,
            isNullable: true,
            default: col.type === 'tinyint' ? '0' : undefined,
          }),
        );
      }
    }

    // ========================================
    // Boleto specific columns
    // ========================================
    const boletoColumns = [
      { name: 'alias', type: 'varchar', length: '255' },
      { name: 'type', type: 'varchar', length: '20' },
      { name: 'close_payment', type: 'date', length: undefined },
      { name: 'document_number', type: 'varchar', length: '20' },
      { name: 'account_number', type: 'varchar', length: '50' },
      { name: 'account_branch', type: 'varchar', length: '10' },
      { name: 'interest_start_date', type: 'date', length: undefined },
      { name: 'interest_value', type: 'decimal', length: '10,2' },
      { name: 'interest_type', type: 'varchar', length: '20' },
      { name: 'fine_start_date', type: 'date', length: undefined },
      { name: 'fine_value', type: 'decimal', length: '10,2' },
      { name: 'fine_type', type: 'varchar', length: '20' },
      { name: 'discount_limit_date', type: 'date', length: undefined },
      { name: 'discount_value', type: 'decimal', length: '10,2' },
      { name: 'discount_type', type: 'varchar', length: '20' },
      { name: 'authentication_code', type: 'varchar', length: '255' },
      { name: 'barcode', type: 'varchar', length: '100' },
      { name: 'digitable', type: 'varchar', length: '100' },
      { name: 'our_number', type: 'varchar', length: '50' },
      { name: 'payments', type: 'json', length: undefined },
      { name: 'cancel_reason', type: 'varchar', length: '50' },
    ];

    for (const col of boletoColumns) {
      const hasColumn = await queryRunner.hasColumn('boleto', col.name);
      if (!hasColumn) {
        await queryRunner.addColumn(
          'boleto',
          new TableColumn({
            name: col.name,
            type: col.type,
            length: col.length,
            isNullable: true,
          }),
        );
      }
    }

    // ========================================
    // BillPayment specific columns
    // ========================================
    const billPaymentColumns = [
      { name: 'digitable', type: 'varchar', length: '60' },
      { name: 'validation_id', type: 'varchar', length: '255' },
      { name: 'authentication_code', type: 'varchar', length: '255' },
      { name: 'transaction_id', type: 'varchar', length: '255' },
      { name: 'assignor', type: 'varchar', length: '255' },
      { name: 'original_amount', type: 'decimal', length: '10,2' },
      { name: 'interest_amount', type: 'decimal', length: '10,2' },
      { name: 'fine_amount', type: 'decimal', length: '10,2' },
      { name: 'discount_amount', type: 'decimal', length: '10,2' },
      { name: 'due_date', type: 'date', length: undefined },
      { name: 'settle_date', type: 'datetime', length: undefined },
      { name: 'payment_date', type: 'datetime', length: undefined },
      { name: 'confirmed_at', type: 'datetime', length: undefined },
      { name: 'bank_branch', type: 'varchar', length: '10' },
      { name: 'bank_account', type: 'varchar', length: '50' },
      { name: 'confirmation_transaction_id', type: 'varchar', length: '50' },
      { name: 'error_code', type: 'varchar', length: '20' },
      { name: 'error_message', type: 'varchar', length: '255' },
      { name: 'cancel_reason', type: 'varchar', length: '255' },
    ];

    for (const col of billPaymentColumns) {
      const hasColumn = await queryRunner.hasColumn('bill_payment', col.name);
      if (!hasColumn) {
        await queryRunner.addColumn(
          'bill_payment',
          new TableColumn({
            name: col.name,
            type: col.type,
            length: col.length,
            isNullable: true,
          }),
        );
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Down migration skipped - these columns should remain
  }
}
