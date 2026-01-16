import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para garantir que as Foreign Keys da tabela Transaction existam.
 * Esta migration verifica e cria as FKs se não existirem.
 */
export class EnsureTransactionForeignKeys1768200700000 implements MigrationInterface {
  name = 'EnsureTransactionForeignKeys1768200700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Definição das Foreign Keys
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
      // Verificar se a FK já existe
      const fkExists = await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.table_constraints 
         WHERE table_schema = DATABASE() 
         AND table_name = 'transaction' 
         AND constraint_name = '${fk.name}'
         AND constraint_type = 'FOREIGN KEY'`,
      );

      if (fkExists[0].count === 0) {
        // Verificar se a tabela referenciada existe
        const tableExists = await queryRunner.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() 
           AND table_name = '${fk.refTable}'`,
        );

        if (tableExists[0].count > 0) {
          console.log(`Creating FK: ${fk.name}`);
          await queryRunner.query(
            `ALTER TABLE \`transaction\` 
             ADD CONSTRAINT \`${fk.name}\` 
             FOREIGN KEY (\`${fk.column}\`) 
             REFERENCES \`${fk.refTable}\`(\`id\`) 
             ON DELETE SET NULL`,
          );
          console.log(`FK ${fk.name} created successfully`);
        } else {
          console.log(
            `Table ${fk.refTable} does not exist, skipping FK ${fk.name}`,
          );
        }
      } else {
        console.log(`FK ${fk.name} already exists`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
  }
}
