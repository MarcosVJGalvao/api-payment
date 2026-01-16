import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar FKs de client_id e account_id na tabela Transaction.
 */
export class AddTransactionClientAccountFKs1768200900000 implements MigrationInterface {
  name = 'AddTransactionClientAccountFKs1768200900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const foreignKeys = [
      {
        name: 'FK_transaction_client',
        column: 'client_id',
        refTable: 'client',
      },
      {
        name: 'FK_transaction_account',
        column: 'account_id',
        refTable: 'account',
      },
    ];

    // PASSO 1: Dropar FKs existentes (ignorar erros)
    console.log('=== STEP 1: Dropping existing FKs ===');
    for (const fk of foreignKeys) {
      try {
        await queryRunner.query(
          `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`${fk.name}\``,
        );
        console.log(`Dropped: ${fk.name}`);
      } catch {
        console.log(`${fk.name} did not exist (ok)`);
      }
    }

    // PASSO 2: Padronizar colunas para varchar(36) utf8mb4_unicode_ci
    console.log('\n=== STEP 2: Standardizing columns ===');
    for (const fk of foreignKeys) {
      const isNullable = fk.column === 'account_id' ? 'NULL' : 'NOT NULL';
      await queryRunner.query(
        `ALTER TABLE \`transaction\` MODIFY COLUMN \`${fk.column}\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ${isNullable}`,
      );
      console.log(`Standardized: ${fk.column}`);
    }

    // Padronizar IDs das tabelas referenciadas
    await queryRunner.query(
      `ALTER TABLE \`client\` MODIFY COLUMN \`id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
    );
    console.log('Standardized: client.id');

    await queryRunner.query(
      `ALTER TABLE \`account\` MODIFY COLUMN \`id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
    );
    console.log('Standardized: account.id');

    // PASSO 3: Criar FKs
    console.log('\n=== STEP 3: Creating FKs ===');
    for (const fk of foreignKeys) {
      const onDelete = fk.column === 'account_id' ? 'SET NULL' : 'NO ACTION';
      const sql = `ALTER TABLE \`transaction\` ADD CONSTRAINT \`${fk.name}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.refTable}\`(\`id\`) ON DELETE ${onDelete}`;
      console.log(`Executing: ${sql}`);
      await queryRunner.query(sql);
      console.log(`Created: ${fk.name}`);
    }

    // PASSO 4: Verificar
    console.log('\n=== STEP 4: Verifying ===');
    const result = await queryRunner.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'transaction' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('All FKs in transaction table:');
    console.table(result);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fkNames = ['FK_transaction_account', 'FK_transaction_client'];

    for (const fkName of fkNames) {
      try {
        await queryRunner.query(
          `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`${fkName}\``,
        );
      } catch {
        // ignore
      }
    }
  }
}
