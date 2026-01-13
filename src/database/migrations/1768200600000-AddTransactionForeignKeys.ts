import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar Foreign Keys na tabela Transaction.
 *
 * Esta migration:
 * 1. Remove todas as FKs existentes que podem conflitar
 * 2. Padroniza todas as colunas de ID para varchar(36) utf8mb4_unicode_ci
 * 3. Adiciona a coluna deleted_at se não existir
 * 4. Cria as Foreign Keys
 */
export class AddTransactionForeignKeys1768200600000 implements MigrationInterface {
  name = 'AddTransactionForeignKeys1768200600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // STEP 1: Drop ALL existing FKs on transaction table that might conflict
    // ========================================
    const fksToCheck = [
      'FK_transaction_pix_cash_in',
      'FK_transaction_pix_transfer',
      'FK_transaction_pix_refund',
      'FK_transaction_boleto',
      'FK_transaction_bill_payment',
    ];

    for (const fkName of fksToCheck) {
      try {
        await queryRunner.query(
          `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`${fkName}\``,
        );
      } catch {
        // FK doesn't exist, continue
      }
    }

    // ========================================
    // STEP 2: Standardize ALL referenced table IDs to varchar(36) utf8mb4_unicode_ci
    // ========================================
    const tablesToStandardize = [
      'pix_cash_in',
      'pix_refund',
      'pix_transfer',
      'boleto',
      'bill_payment',
    ];

    for (const tableName of tablesToStandardize) {
      // Check if table exists
      const tableExists = await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${tableName}'`,
      );

      if (tableExists[0].count > 0) {
        // Modify the id column to varchar(36) with explicit charset and collation
        await queryRunner.query(
          `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
        );
      }
    }

    // ========================================
    // STEP 3: Standardize transaction FK columns to varchar(36) utf8mb4_unicode_ci
    // ========================================
    const fkColumns = [
      'pix_cash_in_id',
      'pix_transfer_id',
      'pix_refund_id',
      'boleto_id',
      'bill_payment_id',
    ];

    for (const colName of fkColumns) {
      // Check if column exists
      const columnExists = await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'transaction' AND column_name = '${colName}'`,
      );

      if (columnExists[0].count > 0) {
        // Modify the column
        await queryRunner.query(
          `ALTER TABLE \`transaction\` MODIFY COLUMN \`${colName}\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL`,
        );
      } else {
        // Add the column
        await queryRunner.query(
          `ALTER TABLE \`transaction\` ADD COLUMN \`${colName}\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL`,
        );
      }
    }

    // ========================================
    // STEP 4: Add deleted_at column if not exists
    // ========================================
    const deletedAtExists = await queryRunner.query(
      `SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'transaction' AND column_name = 'deleted_at'`,
    );

    if (deletedAtExists[0].count === 0) {
      await queryRunner.query(
        `ALTER TABLE \`transaction\` ADD COLUMN \`deleted_at\` datetime NULL COMMENT 'Data de exclusão do registro'`,
      );
    }

    // ========================================
    // STEP 5: Create Foreign Keys
    // ========================================
    const foreignKeys = [
      {
        name: 'FK_transaction_pix_cash_in',
        column: 'pix_cash_in_id',
        refTable: 'pix_cash_in',
      },
      {
        name: 'FK_transaction_pix_transfer',
        column: 'pix_transfer_id',
        refTable: 'pix_transfer',
      },
      {
        name: 'FK_transaction_pix_refund',
        column: 'pix_refund_id',
        refTable: 'pix_refund',
      },
      {
        name: 'FK_transaction_boleto',
        column: 'boleto_id',
        refTable: 'boleto',
      },
      {
        name: 'FK_transaction_bill_payment',
        column: 'bill_payment_id',
        refTable: 'bill_payment',
      },
    ];

    for (const fk of foreignKeys) {
      // Check if table exists before creating FK
      const tableExists = await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${fk.refTable}'`,
      );

      if (tableExists[0].count > 0) {
        // Check if FK already exists
        const fkExists = await queryRunner.query(
          `SELECT COUNT(*) as count FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'transaction' AND constraint_name = '${fk.name}'`,
        );

        if (fkExists[0].count === 0) {
          await queryRunner.query(
            `ALTER TABLE \`transaction\` ADD CONSTRAINT \`${fk.name}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.refTable}\`(\`id\`) ON DELETE SET NULL`,
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Foreign Keys
    const fksToDrop = [
      'FK_transaction_bill_payment',
      'FK_transaction_boleto',
      'FK_transaction_pix_refund',
      'FK_transaction_pix_transfer',
      'FK_transaction_pix_cash_in',
    ];

    for (const fkName of fksToDrop) {
      try {
        await queryRunner.query(
          `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`${fkName}\``,
        );
      } catch {
        // FK doesn't exist, continue
      }
    }

    // Drop columns (only the ones we might have added or need to revert)
    const columnsToDrop = ['deleted_at'];

    for (const colName of columnsToDrop) {
      try {
        await queryRunner.query(
          `ALTER TABLE \`transaction\` DROP COLUMN \`${colName}\``,
        );
      } catch {
        // Column doesn't exist, continue
      }
    }

    // Note: We don't revert the varchar changes as that could break existing data
    // and the previous type was char(36) which is compatible for storage
  }
}
