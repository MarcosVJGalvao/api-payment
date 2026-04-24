import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebhookConfigurationTable1769100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`webhook_configuration\` (
        \`id\` varchar(36) NOT NULL,
        \`client_id\` varchar(36) NOT NULL COMMENT 'FK para o cliente dono desta configuração',
        \`event_type\` varchar(100) NOT NULL COMMENT 'Tipo de evento interno da api-payment',
        \`url\` varchar(500) NOT NULL COMMENT 'URL de destino do cliente (deve ser HTTPS)',
        \`public_key\` varchar(255) NOT NULL COMMENT 'Chave pública enviada no header',
        \`private_key\` varchar(255) NOT NULL COMMENT 'Segredo HMAC para assinatura',
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Apenas configurações ativas recebem eventos',
        \`circuit_breaker_failure_count\` int NOT NULL DEFAULT 0 COMMENT 'Falhas consecutivas desde o último sucesso',
        \`circuit_breaker_open_until\` datetime NULL COMMENT 'null = circuito fechado',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_wc_client_id\` (\`client_id\`),
        INDEX \`IDX_wc_client_event\` (\`client_id\`, \`event_type\`),
        INDEX \`IDX_wc_client_active\` (\`client_id\`, \`is_active\`),
        CONSTRAINT \`FK_wc_client\` FOREIGN KEY (\`client_id\`)
          REFERENCES \`client\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`webhook_configuration\``);
  }
}
