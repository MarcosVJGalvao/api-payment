import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebhookRegistrationCallbackFields1769000000000 implements MigrationInterface {
  name = 'AddWebhookRegistrationCallbackFields1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`webhook\`
      ADD COLUMN \`registration_callback_uri\` varchar(500) NULL COMMENT 'Endpoint de callback para sucesso de cadastro de webhook',
      ADD COLUMN \`registration_callback_secret\` varchar(255) NULL COMMENT 'Segredo HMAC para assinatura do webhook de sucesso de cadastro'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`webhook\`
      DROP COLUMN \`registration_callback_secret\`,
      DROP COLUMN \`registration_callback_uri\`
    `);
  }
}
