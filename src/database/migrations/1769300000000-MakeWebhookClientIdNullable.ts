import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeWebhookClientIdNullable1769300000000 implements MigrationInterface {
  name = 'MakeWebhookClientIdNullable1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`webhook\`
      DROP FOREIGN KEY \`FK_webhook_client_id\`
    `).catch(() => {
      // FK pode ter nome diferente dependendo de como foi criada
    });

    const fks = await queryRunner.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'webhook'
        AND COLUMN_NAME = 'client_id'
        AND REFERENCED_TABLE_NAME = 'client'
        AND TABLE_SCHEMA = DATABASE()
    `);

    for (const fk of fks) {
      await queryRunner.query(
        `ALTER TABLE \`webhook\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`webhook\`
      MODIFY COLUMN \`client_id\` varchar(36) NULL COMMENT 'ID do cliente (NULL para webhooks de sistema)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`webhook\`
      MODIFY COLUMN \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente'
    `);
  }
}
