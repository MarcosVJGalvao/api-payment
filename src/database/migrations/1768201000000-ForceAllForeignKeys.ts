import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para FORÇAR a criação de TODAS as Foreign Keys do schema.
 * Padroniza colunas e recria todas as FKs.
 */
export class ForceAllForeignKeys1768201000000 implements MigrationInterface {
  name = 'ForceAllForeignKeys1768201000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Todas as FKs que devem existir no sistema
    const allForeignKeys = [
      // role_permission
      { table: 'role_permission', fkName: 'FK_role_permission_role', column: 'role_id', refTable: 'role', onDelete: 'CASCADE' },
      { table: 'role_permission', fkName: 'FK_role_permission_permission', column: 'permission_id', refTable: 'permission', onDelete: 'CASCADE' },

      // provider_credentials
      { table: 'provider_credentials', fkName: 'FK_provider_credentials_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },

      // onboarding
      { table: 'onboarding', fkName: 'FK_onboarding_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },

      // account
      { table: 'account', fkName: 'FK_account_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'account', fkName: 'FK_account_onboarding', column: 'onboarding_id', refTable: 'onboarding', onDelete: 'NO ACTION' },

      // boleto
      { table: 'boleto', fkName: 'FK_boleto_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'boleto', fkName: 'FK_boleto_account', column: 'account_id', refTable: 'account', onDelete: 'NO ACTION' },

      // webhook
      { table: 'webhook', fkName: 'FK_webhook_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },

      // client_role
      { table: 'client_role', fkName: 'FK_client_role_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'client_role', fkName: 'FK_client_role_role', column: 'role_id', refTable: 'role', onDelete: 'NO ACTION' },

      // client_permission
      { table: 'client_permission', fkName: 'FK_client_permission_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'client_permission', fkName: 'FK_client_permission_permission', column: 'permission_id', refTable: 'permission', onDelete: 'NO ACTION' },

      // bill_payment
      { table: 'bill_payment', fkName: 'FK_bill_payment_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'bill_payment', fkName: 'FK_bill_payment_account', column: 'account_id', refTable: 'account', onDelete: 'NO ACTION' },

      // pix_transfer
      { table: 'pix_transfer', fkName: 'FK_pix_transfer_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'pix_transfer', fkName: 'FK_pix_transfer_account', column: 'account_id', refTable: 'account', onDelete: 'NO ACTION' },

      // pix_cash_in
      { table: 'pix_cash_in', fkName: 'FK_pix_cash_in_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'pix_cash_in', fkName: 'FK_pix_cash_in_account', column: 'account_id', refTable: 'account', onDelete: 'NO ACTION' },

      // pix_refund
      { table: 'pix_refund', fkName: 'FK_pix_refund_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'pix_refund', fkName: 'FK_pix_refund_account', column: 'account_id', refTable: 'account', onDelete: 'NO ACTION' },

      // transaction (já criadas, mas garantindo)
      { table: 'transaction', fkName: 'FK_transaction_client', column: 'client_id', refTable: 'client', onDelete: 'NO ACTION' },
      { table: 'transaction', fkName: 'FK_transaction_account', column: 'account_id', refTable: 'account', onDelete: 'SET NULL' },
    ];

    // Tabelas base que precisam ter ID padronizado
    const baseTables = ['client', 'account', 'onboarding', 'role', 'permission'];

    // PASSO 1: Padronizar IDs das tabelas base
    console.log('=== STEP 1: Standardizing base table IDs ===');
    for (const table of baseTables) {
      try {
        await queryRunner.query(
          `ALTER TABLE \`${table}\` MODIFY COLUMN \`id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
        );
        console.log(`Standardized: ${table}.id`);
      } catch (e) {
        console.log(`Error standardizing ${table}.id:`, e);
      }
    }

    // PASSO 2: Dropar e recriar todas as FKs
    console.log('\n=== STEP 2: Recreating all FKs ===');
    for (const fk of allForeignKeys) {
      // Verificar se a tabela existe
      const tableExists = await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${fk.table}'`,
      );

      if (tableExists[0].count === 0) {
        console.log(`Table ${fk.table} does not exist, skipping`);
        continue;
      }

      // Dropar FK existente (ignorar erro)
      try {
        await queryRunner.query(`ALTER TABLE \`${fk.table}\` DROP FOREIGN KEY \`${fk.fkName}\``);
        console.log(`Dropped: ${fk.fkName}`);
      } catch {
        // FK não existe, ok
      }

      // Padronizar coluna FK
      try {
        const columnInfo = await queryRunner.query(
          `SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '${fk.table}' AND column_name = '${fk.column}'`,
        );

        if (columnInfo.length > 0) {
          const nullable = columnInfo[0].IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
          await queryRunner.query(
            `ALTER TABLE \`${fk.table}\` MODIFY COLUMN \`${fk.column}\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ${nullable}`,
          );
          console.log(`Standardized: ${fk.table}.${fk.column}`);
        }
      } catch (e) {
        console.log(`Error standardizing ${fk.table}.${fk.column}:`, e);
      }

      // Criar FK
      try {
        await queryRunner.query(
          `ALTER TABLE \`${fk.table}\` ADD CONSTRAINT \`${fk.fkName}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.refTable}\`(\`id\`) ON DELETE ${fk.onDelete}`,
        );
        console.log(`Created: ${fk.fkName}`);
      } catch (e) {
        console.log(`Error creating ${fk.fkName}:`, e);
      }
    }

    // PASSO 3: Verificar
    console.log('\n=== STEP 3: Summary of all FKs ===');
    const result = await queryRunner.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `);
    console.table(result);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Esta migration é apenas para garantir que as FKs existam
    // O down não faz nada pois as FKs já deveriam existir antes
    console.log('Down migration - keeping FKs in place');
  }
}
