import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para FORÇAR a criação das Foreign Keys da tabela Transaction.
 * Esta migration remove e recria todas as FKs sem verificações.
 */
export class ForceTransactionForeignKeys1768200800000 implements MigrationInterface {
  name = 'ForceTransactionForeignKeys1768200800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Lista das FKs a serem criadas
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

    // PASSO 1: Dropar TODAS as FKs (ignorar erros)
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

    // PASSO 2: Criar TODAS as FKs
    console.log('\n=== STEP 2: Creating FKs ===');
    for (const fk of foreignKeys) {
      const sql = `ALTER TABLE \`transaction\` ADD CONSTRAINT \`${fk.name}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.refTable}\`(\`id\`) ON DELETE SET NULL`;
      console.log(`Executing: ${sql}`);
      await queryRunner.query(sql);
      console.log(`Created: ${fk.name}`);
    }

    // PASSO 3: Verificar
    console.log('\n=== STEP 3: Verifying ===');
    const result = await queryRunner.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'transaction' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('FKs in database:');
    console.table(result);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fkNames = [
      'FK_transaction_bill_payment',
      'FK_transaction_boleto',
      'FK_transaction_pix_refund',
      'FK_transaction_pix_transfer',
      'FK_transaction_pix_cash_in',
    ];

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
