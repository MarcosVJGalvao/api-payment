import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePayerColumnsFromBillPayment1736434879000
  implements MigrationInterface
{
  name = 'RemovePayerColumnsFromBillPayment1736434879000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove payer_name column
    await queryRunner.query(`
      ALTER TABLE \`bill_payment\` DROP COLUMN \`payer_name\`
    `);

    // Remove payer_document column
    await queryRunner.query(`
      ALTER TABLE \`bill_payment\` DROP COLUMN \`payer_document\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add payer_document column
    await queryRunner.query(`
      ALTER TABLE \`bill_payment\`
      ADD COLUMN \`payer_document\` varchar(20) NULL COMMENT 'CNPJ/CPF do pagador'
    `);

    // Re-add payer_name column
    await queryRunner.query(`
      ALTER TABLE \`bill_payment\`
      ADD COLUMN \`payer_name\` varchar(255) NULL COMMENT 'Nome do pagador'
    `);
  }
}
