import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para limpar dados órfãos e criar as FKs que falharam anteriormente.
 */
export class CleanOrphanedDataAndCreateFKs1768201100000 implements MigrationInterface {
  name = 'CleanOrphanedDataAndCreateFKs1768201100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // STEP 1: Limpar dados órfãos
    // ========================================
    console.log('=== STEP 1: Cleaning orphaned data ===');

    // Onboarding com client_id inválido
    const orphanedOnboarding = await queryRunner.query(`
      SELECT COUNT(*) as count FROM onboarding 
      WHERE client_id NOT IN (SELECT id FROM client)
    `);
    console.log(`Orphaned onboarding records: ${orphanedOnboarding[0].count}`);
    await queryRunner.query(`
      DELETE FROM onboarding WHERE client_id NOT IN (SELECT id FROM client)
    `);

    // Account com client_id inválido
    const orphanedAccountClient = await queryRunner.query(`
      SELECT COUNT(*) as count FROM account 
      WHERE client_id NOT IN (SELECT id FROM client)
    `);
    console.log(
      `Orphaned account (client) records: ${orphanedAccountClient[0].count}`,
    );
    await queryRunner.query(`
      DELETE FROM account WHERE client_id NOT IN (SELECT id FROM client)
    `);

    // Boleto com client_id inválido
    const orphanedBoletoClient = await queryRunner.query(`
      SELECT COUNT(*) as count FROM boleto 
      WHERE client_id NOT IN (SELECT id FROM client)
    `);
    console.log(
      `Orphaned boleto (client) records: ${orphanedBoletoClient[0].count}`,
    );
    await queryRunner.query(`
      DELETE FROM boleto WHERE client_id NOT IN (SELECT id FROM client)
    `);

    // Boleto com account_id inválido
    const orphanedBoletoAccount = await queryRunner.query(`
      SELECT COUNT(*) as count FROM boleto 
      WHERE account_id NOT IN (SELECT id FROM account)
    `);
    console.log(
      `Orphaned boleto (account) records: ${orphanedBoletoAccount[0].count}`,
    );
    await queryRunner.query(`
      DELETE FROM boleto WHERE account_id NOT IN (SELECT id FROM account)
    `);

    // Bill payment com client_id inválido
    const orphanedBillClient = await queryRunner.query(`
      SELECT COUNT(*) as count FROM bill_payment 
      WHERE client_id NOT IN (SELECT id FROM client)
    `);
    console.log(
      `Orphaned bill_payment (client) records: ${orphanedBillClient[0].count}`,
    );
    await queryRunner.query(`
      DELETE FROM bill_payment WHERE client_id NOT IN (SELECT id FROM client)
    `);

    // Bill payment com account_id inválido
    const orphanedBillAccount = await queryRunner.query(`
      SELECT COUNT(*) as count FROM bill_payment 
      WHERE account_id NOT IN (SELECT id FROM account)
    `);
    console.log(
      `Orphaned bill_payment (account) records: ${orphanedBillAccount[0].count}`,
    );
    await queryRunner.query(`
      DELETE FROM bill_payment WHERE account_id NOT IN (SELECT id FROM account)
    `);

    // ========================================
    // STEP 2: Criar as FKs que falharam
    // ========================================
    console.log('\n=== STEP 2: Creating missing FKs ===');

    const missingFKs = [
      {
        table: 'onboarding',
        fkName: 'FK_onboarding_client',
        column: 'client_id',
        refTable: 'client',
      },
      {
        table: 'account',
        fkName: 'FK_account_client',
        column: 'client_id',
        refTable: 'client',
      },
      {
        table: 'boleto',
        fkName: 'FK_boleto_client',
        column: 'client_id',
        refTable: 'client',
      },
      {
        table: 'boleto',
        fkName: 'FK_boleto_account',
        column: 'account_id',
        refTable: 'account',
      },
      {
        table: 'bill_payment',
        fkName: 'FK_bill_payment_client',
        column: 'client_id',
        refTable: 'client',
      },
      {
        table: 'bill_payment',
        fkName: 'FK_bill_payment_account',
        column: 'account_id',
        refTable: 'account',
      },
    ];

    for (const fk of missingFKs) {
      // Dropar FK caso exista (para evitar duplicação)
      try {
        await queryRunner.query(
          `ALTER TABLE \`${fk.table}\` DROP FOREIGN KEY \`${fk.fkName}\``,
        );
        console.log(`Dropped existing: ${fk.fkName}`);
      } catch {
        // FK não existe, ok
      }

      // Criar FK
      try {
        await queryRunner.query(
          `ALTER TABLE \`${fk.table}\` ADD CONSTRAINT \`${fk.fkName}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.refTable}\`(\`id\`) ON DELETE NO ACTION`,
        );
        console.log(`Created: ${fk.fkName}`);
      } catch (e) {
        console.log(`Error creating ${fk.fkName}:`, e);
      }
    }

    // ========================================
    // STEP 3: Verificar resultado
    // ========================================
    console.log('\n=== STEP 3: Final verification ===');
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
    // Dropar as FKs criadas
    const fksToDrop = [
      { table: 'bill_payment', fkName: 'FK_bill_payment_account' },
      { table: 'bill_payment', fkName: 'FK_bill_payment_client' },
      { table: 'boleto', fkName: 'FK_boleto_account' },
      { table: 'boleto', fkName: 'FK_boleto_client' },
      { table: 'account', fkName: 'FK_account_client' },
      { table: 'onboarding', fkName: 'FK_onboarding_client' },
    ];

    for (const fk of fksToDrop) {
      try {
        await queryRunner.query(
          `ALTER TABLE \`${fk.table}\` DROP FOREIGN KEY \`${fk.fkName}\``,
        );
      } catch {
        // ignore
      }
    }
  }
}
