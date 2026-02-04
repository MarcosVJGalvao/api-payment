import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona índices compostos para otimização de queries de extrato.
 * - idx_transaction_account_created: Acelera filtros por conta + data
 * - idx_transaction_account_type_created: Acelera filtros por conta + tipo + data
 */
export class AddTransactionCompositeIndexes1738637094000 implements MigrationInterface {
  name = 'AddTransactionCompositeIndexes1738637094000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX \`idx_transaction_account_created\` 
      ON \`transaction\` (\`account_id\`, \`created_at\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`idx_transaction_account_type_created\` 
      ON \`transaction\` (\`account_id\`, \`type\`, \`created_at\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX \`idx_transaction_account_type_created\` ON \`transaction\`
    `);

    await queryRunner.query(`
      DROP INDEX \`idx_transaction_account_created\` ON \`transaction\`
    `);
  }
}
