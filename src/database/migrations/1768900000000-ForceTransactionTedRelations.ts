import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class ForceTransactionTedRelations1768900000000 implements MigrationInterface {
  name = 'ForceTransactionTedRelations1768900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('=== Starting Migration: ForceTransactionTedRelations ===');

    // 1. Clean orphaned data to avoid FK constraint violations
    console.log('Step 1: Cleaning orphaned records in transaction table...');

    // Clean ted_transfer_id
    const orphanedTransfer = await queryRunner.query(`
      SELECT COUNT(*) as count FROM transaction 
      WHERE ted_transfer_id COLLATE utf8mb4_unicode_ci IS NOT NULL 
      AND ted_transfer_id COLLATE utf8mb4_unicode_ci NOT IN (SELECT id COLLATE utf8mb4_unicode_ci FROM ted_transfer)
    `);
    if (orphanedTransfer[0].count > 0) {
      console.log(
        `Removing ${orphanedTransfer[0].count} orphaned ted_transfer references`,
      );
      await queryRunner.query(`
        UPDATE transaction SET ted_transfer_id = NULL 
        WHERE ted_transfer_id COLLATE utf8mb4_unicode_ci IS NOT NULL 
        AND ted_transfer_id COLLATE utf8mb4_unicode_ci NOT IN (SELECT id COLLATE utf8mb4_unicode_ci FROM ted_transfer)
      `);
    }

    // Clean ted_cash_in_id
    const orphanedCashIn = await queryRunner.query(`
      SELECT COUNT(*) as count FROM transaction 
      WHERE ted_cash_in_id COLLATE utf8mb4_unicode_ci IS NOT NULL 
      AND ted_cash_in_id COLLATE utf8mb4_unicode_ci NOT IN (SELECT id COLLATE utf8mb4_unicode_ci FROM ted_cash_in)
    `);
    if (orphanedCashIn[0].count > 0) {
      console.log(
        `Removing ${orphanedCashIn[0].count} orphaned ted_cash_in references`,
      );
      await queryRunner.query(`
        UPDATE transaction SET ted_cash_in_id = NULL 
        WHERE ted_cash_in_id COLLATE utf8mb4_unicode_ci IS NOT NULL 
        AND ted_cash_in_id COLLATE utf8mb4_unicode_ci NOT IN (SELECT id COLLATE utf8mb4_unicode_ci FROM ted_cash_in)
      `);
    }

    // Clean ted_refund_id
    const orphanedRefund = await queryRunner.query(`
      SELECT COUNT(*) as count FROM transaction 
      WHERE ted_refund_id COLLATE utf8mb4_unicode_ci IS NOT NULL 
      AND ted_refund_id COLLATE utf8mb4_unicode_ci NOT IN (SELECT id COLLATE utf8mb4_unicode_ci FROM ted_refund)
    `);
    if (orphanedRefund[0].count > 0) {
      console.log(
        `Removing ${orphanedRefund[0].count} orphaned ted_refund references`,
      );
      await queryRunner.query(`
        UPDATE transaction SET ted_refund_id = NULL 
        WHERE ted_refund_id COLLATE utf8mb4_unicode_ci IS NOT NULL 
        AND ted_refund_id COLLATE utf8mb4_unicode_ci NOT IN (SELECT id COLLATE utf8mb4_unicode_ci FROM ted_refund)
      `);
    }

    // 2. Harmonize Collations
    console.log('Step 2: Harmonizing collations across all TED tables...');

    // Drop existing FKs that might block collation changes
    const fksToDrop = [
      { table: 'ted_refund', name: 'FK_ted_refund_transfer' },
      { table: 'ted_refund', name: 'FK_ted_refund_cash_in' },
    ];

    for (const fk of fksToDrop) {
      try {
        await queryRunner.dropForeignKey(fk.table, fk.name);
        console.log(`Dropped existing FK: ${fk.name}`);
      } catch (e) {
        // Ignore if FK doesn't exist
      }
    }

    // Update collations for all related columns
    const tablesToFix = [
      {
        table: 'transaction',
        columns: ['ted_transfer_id', 'ted_cash_in_id', 'ted_refund_id'],
      },
      { table: 'ted_transfer', columns: ['id'] },
      { table: 'ted_cash_in', columns: ['id'] },
      {
        table: 'ted_refund',
        columns: ['id', 'related_ted_transfer_id', 'related_ted_cash_in_id'],
      },
    ];

    for (const item of tablesToFix) {
      for (const col of item.columns) {
        await queryRunner.query(`
          ALTER TABLE \`${item.table}\` 
          MODIFY \`${col}\` VARCHAR(36) COLLATE utf8mb4_unicode_ci
        `);
      }
    }

    // Recreate the dropped FKs in ted_refund
    console.log('Recreating ted_refund Foreign Keys...');
    await queryRunner.createForeignKeys('ted_refund', [
      new TableForeignKey({
        name: 'FK_ted_refund_transfer',
        columnNames: ['related_ted_transfer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ted_transfer',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_ted_refund_cash_in',
        columnNames: ['related_ted_cash_in_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ted_cash_in',
        onDelete: 'SET NULL',
      }),
    ]);

    // 3. Add Indexes for performance
    console.log('Step 3: Adding indexes to transaction table...');
    await queryRunner.createIndices('transaction', [
      new TableIndex({
        name: 'IDX_transaction_ted_transfer_id',
        columnNames: ['ted_transfer_id'],
      }),
      new TableIndex({
        name: 'IDX_transaction_ted_cash_in_id',
        columnNames: ['ted_cash_in_id'],
      }),
      new TableIndex({
        name: 'IDX_transaction_ted_refund_id',
        columnNames: ['ted_refund_id'],
      }),
    ]);

    // 4. Create Foreign Keys
    console.log('Step 4: Creating Foreign Keys...');
    await queryRunner.createForeignKeys('transaction', [
      new TableForeignKey({
        name: 'FK_transaction_ted_transfer',
        columnNames: ['ted_transfer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ted_transfer',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_transaction_ted_cash_in',
        columnNames: ['ted_cash_in_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ted_cash_in',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_transaction_ted_refund',
        columnNames: ['ted_refund_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ted_refund',
        onDelete: 'SET NULL',
      }),
    ]);

    console.log(
      '=== Migration ForceTransactionTedRelations completed successfully ===',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Foreign Keys
    await queryRunner.dropForeignKey(
      'transaction',
      'FK_transaction_ted_refund',
    );
    await queryRunner.dropForeignKey(
      'transaction',
      'FK_transaction_ted_cash_in',
    );
    await queryRunner.dropForeignKey(
      'transaction',
      'FK_transaction_ted_transfer',
    );

    // Drop Indexes
    await queryRunner.dropIndex('transaction', 'IDX_transaction_ted_refund_id');
    await queryRunner.dropIndex(
      'transaction',
      'IDX_transaction_ted_cash_in_id',
    );
    await queryRunner.dropIndex(
      'transaction',
      'IDX_transaction_ted_transfer_id',
    );
  }
}
