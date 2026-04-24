import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebhookMessageTable1769200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`webhook_message\` (
        \`id\` varchar(36) NOT NULL,
        \`configuration_id\` varchar(36) NOT NULL COMMENT 'FK para webhook_configuration',
        \`client_id\` varchar(36) NOT NULL COMMENT 'Desnormalizado para consultas rápidas',
        \`event_type\` varchar(100) NOT NULL COMMENT 'Evento interno da api-payment',
        \`provider_event_name\` varchar(100) NOT NULL COMMENT 'Valor original do WebhookEvent enum',
        \`provider_slug\` varchar(50) NOT NULL COMMENT 'Identificador do provider financeiro',
        \`payload\` json NOT NULL COMMENT 'Array completo do payload enviado ao cliente',
        \`status\` varchar(50) NOT NULL DEFAULT 'PENDING' COMMENT 'Estado atual da mensagem',
        \`attempt_count\` int NOT NULL DEFAULT 0,
        \`last_attempted_at\` datetime NULL,
        \`delivered_at\` datetime NULL,
        \`last_error\` text NULL,
        \`response_status_code\` int NULL,
        \`correlation_id\` varchar(100) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_wm_configuration_id\` (\`configuration_id\`),
        INDEX \`IDX_wm_client_id\` (\`client_id\`),
        INDEX \`IDX_wm_status\` (\`status\`),
        INDEX \`IDX_wm_created_at\` (\`created_at\`),
        INDEX \`IDX_wm_provider_event\` (\`provider_event_name\`),
        CONSTRAINT \`FK_wm_configuration\` FOREIGN KEY (\`configuration_id\`)
          REFERENCES \`webhook_configuration\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`webhook_message\``);
  }
}
