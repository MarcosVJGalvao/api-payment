import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTedAuditActions1768800000000 implements MigrationInterface {
  name = 'AddTedAuditActions1768800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar a coluna enum para incluir TED_TRANSFER_CREATED
    await queryRunner.query(`
      ALTER TABLE audit_log 
      MODIFY COLUMN action ENUM(
        'USER_CREATED',
        'USER_UPDATED',
        'USER_PASSWORD_CHANGED',
        'USER_DELETED',
        'ROLE_CREATED',
        'ROLE_UPDATED',
        'ROLE_DELETED',
        'PERMISSION_GRANTED',
        'PERMISSION_REVOKED',
        'ONBOARDING_CREATED',
        'ONBOARDING_CONFIRMED',
        'ACCOUNT_CREATED',
        'ACCOUNT_UPDATED',
        'ACCOUNT_DELETED',
        'PROVIDER_CREDENTIAL_CREATED',
        'PROVIDER_CREDENTIAL_UPDATED',
        'PROVIDER_CREDENTIAL_DELETED',
        'WEBHOOK_CREATED',
        'WEBHOOK_UPDATED',
        'WEBHOOK_DELETED',
        'BOLETO_CREATED',
        'BOLETO_UPDATED',
        'BOLETO_CANCELED',
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'CLIENT_DELETED',
        'BILL_PAYMENT_VALIDATED',
        'BILL_PAYMENT_CONFIRMED',
        'PIX_KEY_REGISTERED',
        'PIX_KEY_DELETED',
        'PIX_TRANSFER_CREATED',
        'PIX_QRCODE_CREATED',
        'TED_TRANSFER_CREATED'
      ) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover TED_TRANSFER_CREATED do enum
    await queryRunner.query(`
      ALTER TABLE audit_log 
      MODIFY COLUMN action ENUM(
        'USER_CREATED',
        'USER_UPDATED',
        'USER_PASSWORD_CHANGED',
        'USER_DELETED',
        'ROLE_CREATED',
        'ROLE_UPDATED',
        'ROLE_DELETED',
        'PERMISSION_GRANTED',
        'PERMISSION_REVOKED',
        'ONBOARDING_CREATED',
        'ONBOARDING_CONFIRMED',
        'ACCOUNT_CREATED',
        'ACCOUNT_UPDATED',
        'ACCOUNT_DELETED',
        'PROVIDER_CREDENTIAL_CREATED',
        'PROVIDER_CREDENTIAL_UPDATED',
        'PROVIDER_CREDENTIAL_DELETED',
        'WEBHOOK_CREATED',
        'WEBHOOK_UPDATED',
        'WEBHOOK_DELETED',
        'BOLETO_CREATED',
        'BOLETO_UPDATED',
        'BOLETO_CANCELED',
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'CLIENT_DELETED',
        'BILL_PAYMENT_VALIDATED',
        'BILL_PAYMENT_CONFIRMED',
        'PIX_KEY_REGISTERED',
        'PIX_KEY_DELETED',
        'PIX_TRANSFER_CREATED',
        'PIX_QRCODE_CREATED'
      ) NOT NULL
    `);
  }
}
