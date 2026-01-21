import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar FK de webhook_event_log.client_id para client.id.
 */
export class AddWebhookEventLogClientFK1768360700000 implements MigrationInterface {
  name = 'AddWebhookEventLogClientFK1768360700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Padronizar coluna client_id para compatibilidade com FK
    await queryRunner.query(`
      ALTER TABLE \`webhook_event_log\`
      MODIFY COLUMN \`client_id\` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
    `);

    // Verificar se há registros órfãos e deletá-los
    const orphanedRecords = await queryRunner.query(`
      SELECT wel.id 
      FROM \`webhook_event_log\` wel
      LEFT JOIN \`client\` c ON wel.client_id = c.id
      WHERE c.id IS NULL
    `);

    if (orphanedRecords && orphanedRecords.length > 0) {
      console.log(
        `Deleting ${orphanedRecords.length} orphaned webhook_event_log records...`,
      );
      await queryRunner.query(`
        DELETE wel FROM \`webhook_event_log\` wel
        LEFT JOIN \`client\` c ON wel.client_id = c.id
        WHERE c.id IS NULL
      `);
    }

    // Verificar se FK já existe
    const existingFK = await queryRunner.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'webhook_event_log'
        AND COLUMN_NAME = 'client_id'
        AND REFERENCED_TABLE_NAME = 'client'
    `);

    if (existingFK && existingFK.length > 0) {
      console.log('FK_webhook_event_log_client already exists, skipping...');
      return;
    }

    // Criar FK
    await queryRunner.query(`
      ALTER TABLE \`webhook_event_log\`
      ADD CONSTRAINT \`FK_webhook_event_log_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    console.log('FK_webhook_event_log_client created successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`webhook_event_log\`
      DROP FOREIGN KEY \`FK_webhook_event_log_client\`
    `);
  }
}
