import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1736379207000 implements MigrationInterface {
  name = 'CreateInitialSchema1736379207000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permission table
    await queryRunner.query(`
      CREATE TABLE \`permission\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL COMMENT 'Nome da permissão (ex: user:read)',
        \`module\` varchar(100) NOT NULL COMMENT 'Módulo da permissão (ex: user, employee)',
        \`action\` varchar(50) NOT NULL COMMENT 'Ação da permissão (ex: read, write, create)',
        \`description\` text NULL COMMENT 'Descrição da permissão',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_permission_module_action\` (\`module\`, \`action\`),
        UNIQUE INDEX \`IDX_permission_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create role table
    await queryRunner.query(`
      CREATE TABLE \`role\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL COMMENT 'Nome da role',
        \`description\` text NULL COMMENT 'Descrição da role',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        UNIQUE INDEX \`IDX_role_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create role_permission table
    await queryRunner.query(`
      CREATE TABLE \`role_permission\` (
        \`id\` varchar(36) NOT NULL,
        \`role_id\` varchar(36) NULL,
        \`permission_id\` varchar(36) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_role_permission_role\` (\`role_id\`),
        INDEX \`IDX_role_permission_permission\` (\`permission_id\`),
        UNIQUE INDEX \`IDX_role_permission_unique\` (\`role_id\`, \`permission_id\`, \`deleted_at\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create client table
    await queryRunner.query(`
      CREATE TABLE \`client\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL COMMENT 'Nome do cliente',
        \`document\` varchar(20) NOT NULL COMMENT 'CPF ou CNPJ do cliente',
        \`status\` enum('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status do cliente',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_client_document\` (\`document\`),
        INDEX \`IDX_client_status\` (\`status\`),
        UNIQUE INDEX \`IDX_client_document_unique\` (\`document\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create internal_user table
    await queryRunner.query(`
      CREATE TABLE \`internal_user\` (
        \`id\` varchar(36) NOT NULL,
        \`username\` varchar(100) NOT NULL COMMENT 'Nome de usuário único',
        \`email\` varchar(255) NOT NULL COMMENT 'Email do usuário',
        \`password\` varchar(255) NOT NULL COMMENT 'Senha hasheada',
        \`name\` varchar(255) NOT NULL COMMENT 'Nome completo do usuário',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        UNIQUE INDEX \`IDX_internal_user_username\` (\`username\`),
        UNIQUE INDEX \`IDX_internal_user_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create audit_log table
    await queryRunner.query(`
      CREATE TABLE \`audit_log\` (
        \`id\` varchar(36) NOT NULL,
        \`action\` enum(
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
          'CLIENT_CREATED',
          'CLIENT_UPDATED',
          'CLIENT_DELETED'
        ) NOT NULL COMMENT 'Ação realizada',
        \`entity_type\` varchar(100) NOT NULL COMMENT 'Tipo da entidade (ex: User, Employee)',
        \`entity_id\` varchar(36) NULL COMMENT 'ID da entidade afetada',
        \`user_id\` varchar(36) NULL COMMENT 'ID do usuário que realizou a ação',
        \`username\` varchar(255) NULL COMMENT 'Nome de usuário que realizou a ação',
        \`correlation_id\` varchar(36) NULL COMMENT 'ID de correlação da requisição',
        \`old_values\` json NULL COMMENT 'Valores anteriores da entidade',
        \`new_values\` json NULL COMMENT 'Valores novos da entidade',
        \`ip_address\` varchar(45) NULL COMMENT 'Endereço IP do cliente',
        \`user_agent\` text NULL COMMENT 'User agent do cliente',
        \`description\` text NULL COMMENT 'Descrição adicional da ação',
        \`status\` enum('Success', 'Failure') NOT NULL DEFAULT 'Success' COMMENT 'Status da operação',
        \`error_message\` text NULL COMMENT 'Mensagem de erro, se a operação falhou',
        \`error_code\` varchar(100) NULL COMMENT 'Código do erro, se a operação falhou',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Data e hora da criação do log',
        INDEX \`IDX_audit_log_entity\` (\`entity_type\`, \`entity_id\`),
        INDEX \`IDX_audit_log_user\` (\`user_id\`),
        INDEX \`IDX_audit_log_action\` (\`action\`),
        INDEX \`IDX_audit_log_created_at\` (\`created_at\`),
        INDEX \`IDX_audit_log_correlation\` (\`correlation_id\`),
        INDEX \`IDX_audit_log_status\` (\`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create provider_credentials table
    await queryRunner.query(`
      CREATE TABLE \`provider_credentials\` (
        \`id\` varchar(36) NOT NULL,
        \`provider_slug\` varchar(50) NOT NULL COMMENT 'Identificador do provedor (ex: hiperbanco)',
        \`login_type\` enum('backoffice', 'bank') NOT NULL COMMENT 'Tipo de login: backoffice (email/senha) ou bank (documento/senha)',
        \`login\` varchar(255) NOT NULL COMMENT 'Usuário/Email para login',
        \`password\` text NOT NULL COMMENT 'Senha criptografada',
        \`client_id\` varchar(36) NULL COMMENT 'ID do cliente multi-tenant',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_provider_credentials_provider_login\` (\`provider_slug\`, \`login_type\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create onboarding table
    await queryRunner.query(`
      CREATE TABLE \`onboarding\` (
        \`id\` varchar(36) NOT NULL,
        \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
        \`external_user_id\` varchar(255) NOT NULL COMMENT 'ID externo do usuário no provedor financeiro',
        \`register_name\` varchar(255) NOT NULL COMMENT 'Nome de registro',
        \`document_number\` varchar(20) NOT NULL COMMENT 'Número do documento',
        \`type_account\` enum('PF', 'PJ') NOT NULL COMMENT 'Tipo de conta (PF ou PJ)',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_onboarding_client\` (\`client_id\`),
        UNIQUE INDEX \`IDX_onboarding_external_user_client\` (\`external_user_id\`, \`client_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create account table
    await queryRunner.query(`
      CREATE TABLE \`account\` (
        \`id\` varchar(36) NOT NULL,
        \`external_id\` varchar(255) NOT NULL COMMENT 'ID externo da conta no provedor financeiro',
        \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
        \`onboarding_id\` varchar(36) NULL COMMENT 'ID do onboarding',
        \`status\` enum('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status da conta',
        \`branch\` varchar(10) NOT NULL COMMENT 'Agência da conta',
        \`number\` varchar(20) NOT NULL COMMENT 'Número da conta',
        \`type\` enum('MAIN', 'SAVINGS') NOT NULL COMMENT 'Tipo da conta',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_account_client\` (\`client_id\`),
        INDEX \`IDX_account_onboarding\` (\`onboarding_id\`),
        UNIQUE INDEX \`IDX_account_external_client\` (\`external_id\`, \`client_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create boleto table
    await queryRunner.query(`
      CREATE TABLE \`boleto\` (
        \`id\` varchar(36) NOT NULL,
        \`alias\` varchar(255) NULL COMMENT 'Nome para identificar o boleto externamente',
        \`type\` enum('Deposit', 'Levy') NOT NULL COMMENT 'Tipo de boleto (Deposit ou Levy)',
        \`status\` enum('Failure', 'Processing', 'Pending', 'Approved', 'Paid', 'Expired', 'Cancelled', 'Overdue') NOT NULL DEFAULT 'Pending' COMMENT 'Status atual do boleto',
        \`amount\` decimal(10,2) NOT NULL COMMENT 'Valor do boleto',
        \`due_date\` date NOT NULL COMMENT 'Data de vencimento do boleto',
        \`close_payment\` date NULL COMMENT 'Data limite para pagamento após vencimento',
        \`document_number\` varchar(20) NOT NULL COMMENT 'Número do documento (CPF ou CNPJ) do beneficiário final',
        \`account_number\` varchar(50) NOT NULL COMMENT 'Número da conta do beneficiário',
        \`account_branch\` varchar(10) NOT NULL COMMENT 'Número da agência do beneficiário',
        \`payer_document\` varchar(20) NULL COMMENT 'Número do documento do pagador (CPF ou CNPJ)',
        \`payer_name\` varchar(60) NULL COMMENT 'Nome completo do pagador',
        \`payer_trade_name\` varchar(100) NULL COMMENT 'Nome fantasia ou comercial do pagador',
        \`payer_address\` json NULL COMMENT 'Endereço completo do pagador (JSON)',
        \`interest_start_date\` date NULL COMMENT 'Data de início para cálculo dos juros',
        \`interest_value\` decimal(10,2) NULL COMMENT 'Valor dos juros',
        \`interest_type\` enum('FixedAmount', 'Percent') NULL COMMENT 'Tipo de regra para cálculo dos juros',
        \`fine_start_date\` date NULL COMMENT 'Data de início para cálculo da multa',
        \`fine_value\` decimal(10,2) NULL COMMENT 'Valor da multa',
        \`fine_type\` enum('FixedAmount', 'Percent') NULL COMMENT 'Tipo de regra aplicada à multa',
        \`discount_limit_date\` date NULL COMMENT 'Data limite para incidência de desconto',
        \`discount_value\` decimal(10,2) NULL COMMENT 'Valor do desconto',
        \`discount_type\` enum('FixedAmountUntilLimitDate', 'FixedPercentUntilLimitDate') NULL COMMENT 'Tipo de regra para cálculo do desconto',
        \`authentication_code\` varchar(255) NULL COMMENT 'Código de autenticação recebido via webhook',
        \`barcode\` varchar(100) NULL COMMENT 'Código de barras recebido via webhook',
        \`digitable\` varchar(100) NULL COMMENT 'Linha digitável recebida via webhook',
        \`provider_slug\` enum('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro',
        \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
        \`account_id\` varchar(36) NOT NULL COMMENT 'ID da conta que emitiu o boleto',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_boleto_status\` (\`status\`),
        INDEX \`IDX_boleto_due_date\` (\`due_date\`),
        INDEX \`IDX_boleto_provider\` (\`provider_slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create webhook table
    await queryRunner.query(`
      CREATE TABLE \`webhook\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(50) NOT NULL COMMENT 'Nome do webhook definido pelo usuário',
        \`context\` enum('Boleto', 'Pix', 'Ted', 'Payment', 'Account', 'Authorization', 'Card', 'Customer', 'Business', 'Document', 'Dict', 'Slc', 'OpenFinance') NOT NULL COMMENT 'Contexto do evento (ex: Boleto, Pix)',
        \`event_name\` varchar(255) NOT NULL COMMENT 'Nome do evento assinado',
        \`uri\` varchar(500) NOT NULL COMMENT 'Endpoint de callback para receber eventos',
        \`provider_slug\` varchar(50) NOT NULL COMMENT 'Identificador do provedor financeiro',
        \`external_id\` varchar(255) NULL COMMENT 'ID retornado pelo provedor ao registrar o webhook',
        \`public_key\` text NULL COMMENT 'Chave pública para validação de assinatura',
        \`is_active\` boolean NOT NULL DEFAULT true COMMENT 'Status do webhook',
        \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_webhook_client\` (\`client_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create client_role table
    await queryRunner.query(`
      CREATE TABLE \`client_role\` (
        \`id\` varchar(36) NOT NULL,
        \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
        \`role_id\` varchar(36) NOT NULL COMMENT 'ID da role',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_client_role_client\` (\`client_id\`),
        INDEX \`IDX_client_role_role\` (\`role_id\`),
        UNIQUE INDEX \`IDX_client_role_unique\` (\`client_id\`, \`role_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create client_permission table
    await queryRunner.query(`
      CREATE TABLE \`client_permission\` (
        \`id\` varchar(36) NOT NULL,
        \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
        \`permission_id\` varchar(36) NOT NULL COMMENT 'ID da permissão (scope)',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_client_permission_client\` (\`client_id\`),
        INDEX \`IDX_client_permission_permission\` (\`permission_id\`),
        UNIQUE INDEX \`IDX_client_permission_unique\` (\`client_id\`, \`permission_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`role_permission\`
      ADD CONSTRAINT \`FK_role_permission_role\`
      FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`role_permission\`
      ADD CONSTRAINT \`FK_role_permission_permission\`
      FOREIGN KEY (\`permission_id\`) REFERENCES \`permission\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`provider_credentials\`
      ADD CONSTRAINT \`FK_provider_credentials_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`onboarding\`
      ADD CONSTRAINT \`FK_onboarding_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`account\`
      ADD CONSTRAINT \`FK_account_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`account\`
      ADD CONSTRAINT \`FK_account_onboarding\`
      FOREIGN KEY (\`onboarding_id\`) REFERENCES \`onboarding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`boleto\`
      ADD CONSTRAINT \`FK_boleto_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`boleto\`
      ADD CONSTRAINT \`FK_boleto_account\`
      FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`webhook\`
      ADD CONSTRAINT \`FK_webhook_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`client_role\`
      ADD CONSTRAINT \`FK_client_role_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`client_role\`
      ADD CONSTRAINT \`FK_client_role_role\`
      FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`client_permission\`
      ADD CONSTRAINT \`FK_client_permission_client\`
      FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`client_permission\`
      ADD CONSTRAINT \`FK_client_permission_permission\`
      FOREIGN KEY (\`permission_id\`) REFERENCES \`permission\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE \`client_permission\` DROP FOREIGN KEY \`FK_client_permission_permission\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_permission\` DROP FOREIGN KEY \`FK_client_permission_client\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_role\` DROP FOREIGN KEY \`FK_client_role_role\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_role\` DROP FOREIGN KEY \`FK_client_role_client\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`webhook\` DROP FOREIGN KEY \`FK_webhook_client\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` DROP FOREIGN KEY \`FK_boleto_account\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` DROP FOREIGN KEY \`FK_boleto_client\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_account_onboarding\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_account_client\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`onboarding\` DROP FOREIGN KEY \`FK_onboarding_client\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`provider_credentials\` DROP FOREIGN KEY \`FK_provider_credentials_client\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permission\` DROP FOREIGN KEY \`FK_role_permission_permission\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permission\` DROP FOREIGN KEY \`FK_role_permission_role\``,
    );

    // Drop tables (reverse order)
    await queryRunner.query(`DROP TABLE \`client_permission\``);
    await queryRunner.query(`DROP TABLE \`client_role\``);
    await queryRunner.query(`DROP TABLE \`webhook\``);
    await queryRunner.query(`DROP TABLE \`boleto\``);
    await queryRunner.query(`DROP TABLE \`account\``);
    await queryRunner.query(`DROP TABLE \`onboarding\``);
    await queryRunner.query(`DROP TABLE \`provider_credentials\``);
    await queryRunner.query(`DROP TABLE \`audit_log\``);
    await queryRunner.query(`DROP TABLE \`internal_user\``);
    await queryRunner.query(`DROP TABLE \`client\``);
    await queryRunner.query(`DROP TABLE \`role_permission\``);
    await queryRunner.query(`DROP TABLE \`role\``);
    await queryRunner.query(`DROP TABLE \`permission\``);
  }
}
