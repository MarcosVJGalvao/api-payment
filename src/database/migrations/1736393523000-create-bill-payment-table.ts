import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillPaymentTable1736393523000 implements MigrationInterface {
  name = 'CreateBillPaymentTable1736393523000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bill_payment table
    await queryRunner.query(`
      CREATE TABLE \`bill_payment\` (
        \`id\` varchar(36) NOT NULL,
        \`status\` enum('Created', 'Completed', 'Confirmed', 'Cancelled') NOT NULL DEFAULT 'Created' COMMENT 'Status atual do pagamento',
        \`digitable\` varchar(60) NOT NULL COMMENT 'Linha digitável do título',
        \`validation_id\` varchar(255) NULL COMMENT 'ID retornado na validação (usado para confirmar)',
        \`authentication_code\` varchar(255) NULL COMMENT 'Código de autenticação retornado na confirmação',
        \`transaction_id\` varchar(255) NULL COMMENT 'ID da transação retornado na confirmação',
        \`assignor\` varchar(255) NULL COMMENT 'Nome do cedente (ex: BANCO ITAU S.A.)',
        \`recipient_name\` varchar(255) NULL COMMENT 'Nome do beneficiário',
        \`recipient_document\` varchar(20) NULL COMMENT 'CNPJ/CPF do beneficiário',
        \`payer_name\` varchar(255) NULL COMMENT 'Nome do pagador',
        \`payer_document\` varchar(20) NULL COMMENT 'CNPJ/CPF do pagador',
        \`original_amount\` decimal(10,2) NOT NULL COMMENT 'Valor original do título',
        \`amount\` decimal(10,2) NOT NULL COMMENT 'Valor efetivamente pago',
        \`interest_amount\` decimal(10,2) NULL DEFAULT 0 COMMENT 'Valor de juros calculados',
        \`fine_amount\` decimal(10,2) NULL DEFAULT 0 COMMENT 'Valor de multa calculada',
        \`discount_amount\` decimal(10,2) NULL DEFAULT 0 COMMENT 'Valor de desconto',
        \`due_date\` date NULL COMMENT 'Data de vencimento',
        \`settle_date\` datetime NULL COMMENT 'Data de liquidação',
        \`payment_date\` datetime NULL COMMENT 'Data do pagamento',
        \`confirmed_at\` datetime NULL COMMENT 'Data de confirmação',
        \`bank_branch\` varchar(10) NOT NULL COMMENT 'Agência do pagador',
        \`bank_account\` varchar(50) NOT NULL COMMENT 'Conta do pagador',
        \`description\` varchar(255) NULL COMMENT 'Descrição opcional',
        \`provider_slug\` enum('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro',
        \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
        \`account_id\` varchar(36) NOT NULL COMMENT 'ID da conta que realizou o pagamento',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_bill_payment_status\` (\`status\`),
        INDEX \`IDX_bill_payment_due_date\` (\`due_date\`),
        INDEX \`IDX_bill_payment_provider\` (\`provider_slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`bill_payment\`
      ADD CONSTRAINT \`FK_bill_payment_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`bill_payment\`
      ADD CONSTRAINT \`FK_bill_payment_account\`
      FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Update audit_log enum to include new actions
    await queryRunner.query(`
      ALTER TABLE \`audit_log\`
      MODIFY COLUMN \`action\` enum(
        'USER_CREATED',
        'USER_LOGIN',
        'USER_LOGIN_FAILED',
        'USER_DELETED',
        'USER_PASSWORD_CHANGED',
        'PERMISSION_GRANTED',
        'PERMISSION_REVOKED',
        'ROLE_ASSIGNED',
        'ROLE_REMOVED',
        'PROVIDER_CREDENTIAL_CREATED',
        'WEBHOOK_REGISTERED',
        'WEBHOOK_UPDATED',
        'WEBHOOK_DELETED',
        'BOLETO_CREATED',
        'BOLETO_CANCELLED',
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'CLIENT_DELETED',
        'BILL_PAYMENT_VALIDATED',
        'BILL_PAYMENT_CONFIRMED'
      ) NOT NULL COMMENT 'Ação realizada'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert audit_log enum
    await queryRunner.query(`
      ALTER TABLE \`audit_log\`
      MODIFY COLUMN \`action\` enum(
        'USER_CREATED',
        'USER_LOGIN',
        'USER_LOGIN_FAILED',
        'USER_DELETED',
        'USER_PASSWORD_CHANGED',
        'PERMISSION_GRANTED',
        'PERMISSION_REVOKED',
        'ROLE_ASSIGNED',
        'ROLE_REMOVED',
        'PROVIDER_CREDENTIAL_CREATED',
        'WEBHOOK_REGISTERED',
        'WEBHOOK_UPDATED',
        'WEBHOOK_DELETED',
        'BOLETO_CREATED',
        'BOLETO_CANCELLED',
        'CLIENT_CREATED',
        'CLIENT_UPDATED',
        'CLIENT_DELETED'
      ) NOT NULL COMMENT 'Ação realizada'
    `);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` DROP FOREIGN KEY \`FK_bill_payment_account\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` DROP FOREIGN KEY \`FK_bill_payment_client\``,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE \`bill_payment\``);
  }
}
