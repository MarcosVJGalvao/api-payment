import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1777036978784 implements MigrationInterface {
  name = 'InitialSchema1777036978784';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`client\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL COMMENT 'Nome do cliente', \`document\` varchar(20) NOT NULL COMMENT 'CPF ou CNPJ do cliente', \`alias\` varchar(50) NULL COMMENT 'Alias do cliente para identificação em webhooks', \`status\` enum ('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL COMMENT 'Status do cliente' DEFAULT 'ACTIVE', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_76b252c7aad1930be932f9ae5a\` (\`status\`), UNIQUE INDEX \`IDX_463cae6774e9b085ca966d89b4\` (\`document\`), UNIQUE INDEX \`IDX_71065dd6aa4640d821bfced4e1\` (\`alias\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`onboarding\` (\`id\` varchar(36) NOT NULL, \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`external_user_id\` varchar(255) NOT NULL COMMENT 'ID externo do usuário no provedor financeiro', \`register_name\` varchar(255) NOT NULL COMMENT 'Nome de registro', \`document_number\` varchar(20) NOT NULL COMMENT 'Número do documento', \`type_account\` enum ('PF', 'PJ') NOT NULL COMMENT 'Tipo de conta (PF ou PJ)', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_cfe7cc424013641481aac70658\` (\`client_id\`), UNIQUE INDEX \`IDX_64dfb6cb08b9c1a2a947f59d5f\` (\`external_user_id\`, \`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`account\` (\`id\` varchar(36) NOT NULL, \`external_id\` varchar(255) NOT NULL COMMENT 'ID externo da conta no provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`onboarding_id\` varchar(255) NULL COMMENT 'ID do onboarding', \`status\` enum ('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL COMMENT 'Status da conta' DEFAULT 'ACTIVE', \`branch\` varchar(10) NOT NULL COMMENT 'Agência da conta', \`number\` varchar(20) NOT NULL COMMENT 'Número da conta', \`type\` enum ('MAIN', 'SAVINGS') NOT NULL COMMENT 'Tipo da conta', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_6749b954c82bd3e886527f79e4\` (\`onboarding_id\`), INDEX \`IDX_45a1670bb3c856a6ba08ec3c73\` (\`client_id\`), UNIQUE INDEX \`IDX_a71e3e0c6bfeb02902702f0ee3\` (\`external_id\`, \`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pix_refund\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`authentication_code\` varchar(100) NOT NULL COMMENT 'Identificador único da devolução', \`correlation_id\` varchar(100) NULL, \`idempotency_key\` varchar(100) NULL, \`entity_id\` varchar(100) NULL, \`status\` enum ('RECEIVED', 'CLEARED', 'FAILED') NOT NULL DEFAULT 'RECEIVED', \`end_to_end_id\` varchar(50) NULL COMMENT 'EndToEndId da devolução', \`end_to_end_id_original\` varchar(50) NULL COMMENT 'EndToEndId da transação original', \`refund_reason\` varchar(50) NULL COMMENT 'Motivo: BANK_RETURN, etc', \`error_code\` varchar(20) NULL COMMENT 'Código de erro: MD06, etc', \`error_reason\` varchar(255) NULL COMMENT 'Descrição do erro', \`related_pix_cash_in_id\` varchar(255) NULL COMMENT 'FK para PixCashIn original (quando devolvemos)', \`related_pix_transfer_id\` varchar(255) NULL COMMENT 'FK para PixTransfer original (quando nos devolvem)', \`provider_created_at\` datetime NULL, \`sender_id\` varchar(36) NULL, \`recipient_id\` varchar(36) NULL, INDEX \`IDX_1811f94fe12ca09f29cdb7bb7d\` (\`status\`), INDEX \`IDX_762358ff3dbf74f91ca8f55e5a\` (\`end_to_end_id_original\`), INDEX \`IDX_0521fb3fd441e38e3d2733e787\` (\`end_to_end_id\`), UNIQUE INDEX \`IDX_c3821ac95356a8c6ff8b51feaa\` (\`authentication_code\`), UNIQUE INDEX \`REL_cf47025d94721a3f2fafe7e0c1\` (\`sender_id\`), UNIQUE INDEX \`REL_f98abc6e9840c9db21b73a839a\` (\`recipient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`bill_payment\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`status\` enum ('Created', 'Completed', 'Confirmed', 'Cancelled') NOT NULL COMMENT 'Status atual do pagamento' DEFAULT 'Created', \`digitable\` varchar(60) NOT NULL COMMENT 'Linha digitável do título', \`validation_id\` varchar(255) NULL COMMENT 'ID retornado na validação (usado para confirmar)', \`authentication_code\` varchar(255) NULL COMMENT 'Código de autenticação retornado na confirmação', \`transaction_id\` varchar(255) NULL COMMENT 'ID da transação retornado na confirmação', \`assignor\` varchar(255) NULL COMMENT 'Nome do cedente (ex: BANCO ITAU S.A.)', \`original_amount\` decimal(10,2) NOT NULL COMMENT 'Valor original do título', \`interest_amount\` decimal(10,2) NULL COMMENT 'Valor de juros calculados' DEFAULT '0.00', \`fine_amount\` decimal(10,2) NULL COMMENT 'Valor de multa calculada' DEFAULT '0.00', \`discount_amount\` decimal(10,2) NULL COMMENT 'Valor de desconto' DEFAULT '0.00', \`due_date\` date NULL COMMENT 'Data de vencimento', \`settle_date\` datetime NULL COMMENT 'Data de liquidação', \`payment_date\` datetime NULL COMMENT 'Data do pagamento', \`confirmed_at\` datetime NULL COMMENT 'Data de confirmação', \`bank_branch\` varchar(10) NOT NULL COMMENT 'Agência do pagador', \`bank_account\` varchar(50) NOT NULL COMMENT 'Conta do pagador', \`confirmation_transaction_id\` varchar(50) NULL COMMENT 'ID de confirmação da transação', \`error_code\` varchar(20) NULL COMMENT 'Código de erro', \`error_message\` varchar(255) NULL COMMENT 'Mensagem de erro', \`cancel_reason\` varchar(255) NULL COMMENT 'Motivo do cancelamento', \`recipient_id\` varchar(36) NULL, INDEX \`IDX_ad344ea2a01ccb4f83dbc4137d\` (\`provider_slug\`), INDEX \`IDX_c71857b93b295e30b68e478e40\` (\`due_date\`), INDEX \`IDX_d9184c8543bab80d7234c590b0\` (\`status\`), UNIQUE INDEX \`REL_71b22f7e813d06283450818f24\` (\`recipient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ted_transfer\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`status\` enum ('CREATED', 'IN_PROCESS', 'APPROVED', 'REPROVED', 'DONE', 'UNDONE', 'CANCELED', 'FAILED') NOT NULL COMMENT 'Status da transferência TED' DEFAULT 'CREATED', \`authentication_code\` varchar(100) NULL COMMENT 'Código de autenticação retornado pelo provedor', \`correlation_id\` varchar(100) NULL COMMENT 'ID de correlação', \`idempotency_key\` varchar(100) NULL COMMENT 'Chave de idempotência', \`provider_transaction_id\` varchar(100) NULL COMMENT 'ID da transação no provedor', \`channel\` varchar(20) NULL COMMENT 'Canal (EXTERNAL, INTERNAL)', \`payment_date\` datetime NULL COMMENT 'Data do pagamento efetivo', \`refusal_reason\` varchar(255) NULL COMMENT 'Motivo da recusa (se aplicável)', \`provider_created_at\` datetime NULL COMMENT 'Data de criação no provedor', \`sender_id\` varchar(36) NULL, \`recipient_id\` varchar(36) NULL, INDEX \`IDX_8036ebc3865a691fe2ca6ae834\` (\`client_id\`), INDEX \`IDX_2ab9c770863a109b275f3adaa4\` (\`account_id\`), INDEX \`IDX_25a44af7908ef49439c2d3a57f\` (\`provider_slug\`), INDEX \`IDX_d7a7f865610994eeaded15aab8\` (\`status\`), UNIQUE INDEX \`IDX_69b7bde531d816ab22f69a02d3\` (\`authentication_code\`), UNIQUE INDEX \`REL_79e0ed72b3191b814a397aafe4\` (\`sender_id\`), UNIQUE INDEX \`REL_9252c2e59e0b5d74d9445a144a\` (\`recipient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ted_cash_in\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`authentication_code\` varchar(100) NOT NULL COMMENT 'Identificador único da transação', \`correlation_id\` varchar(100) NULL COMMENT 'ID de correlação do webhook', \`idempotency_key\` varchar(100) NULL COMMENT 'Chave de idempotência do webhook', \`entity_id\` varchar(100) NULL COMMENT 'entityId do webhook', \`status\` enum ('RECEIVED', 'CLEARED', 'FAILED') NOT NULL COMMENT 'Status do TED Cash-In' DEFAULT 'RECEIVED', \`channel\` varchar(20) NULL COMMENT 'Canal: EXTERNAL, INTERNAL', \`provider_created_at\` datetime NULL COMMENT 'Data de criação no provedor', \`sender_id\` varchar(36) NULL, \`recipient_id\` varchar(36) NULL, INDEX \`IDX_db09e3e5f60bab2b78b9bc71a0\` (\`client_id\`), INDEX \`IDX_1f489e5b8b7732bb0384ed5468\` (\`account_id\`), INDEX \`IDX_bd6de36a47622a702a3b1bf668\` (\`status\`), UNIQUE INDEX \`IDX_c998f999ad76ef40d696a677a6\` (\`authentication_code\`), UNIQUE INDEX \`REL_163c198b83ae70cb6bdab1058a\` (\`sender_id\`), UNIQUE INDEX \`REL_13dd4fa827b97259f8f1ab9d18\` (\`recipient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ted_refund\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`authentication_code\` varchar(100) NOT NULL COMMENT 'Identificador único da devolução', \`correlation_id\` varchar(100) NULL, \`idempotency_key\` varchar(100) NULL, \`entity_id\` varchar(100) NULL, \`status\` enum ('RECEIVED', 'CLEARED', 'FAILED') NOT NULL DEFAULT 'RECEIVED', \`original_authentication_code\` varchar(100) NULL COMMENT 'Código de autenticação da transação original', \`refund_reason\` varchar(50) NULL COMMENT 'Motivo da devolução', \`error_code\` varchar(20) NULL COMMENT 'Código de erro', \`error_reason\` varchar(255) NULL COMMENT 'Descrição do erro', \`related_ted_transfer_id\` varchar(255) NULL COMMENT 'FK para TedTransfer original', \`related_ted_cash_in_id\` varchar(255) NULL COMMENT 'FK para TedCashIn original', \`provider_created_at\` datetime NULL, \`sender_id\` varchar(36) NULL, \`recipient_id\` varchar(36) NULL, INDEX \`IDX_4e7b2edec15f22ab887c64c00e\` (\`status\`), UNIQUE INDEX \`IDX_badfbb3844c569f73a9044e3a9\` (\`authentication_code\`), UNIQUE INDEX \`REL_9151297b6f39259725c4f1fb25\` (\`sender_id\`), UNIQUE INDEX \`REL_24ba584ff3ccbab527ca59d7f5\` (\`recipient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`payment_recipient\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NULL COMMENT 'Nome do destinatário', \`document_type\` varchar(20) NULL COMMENT 'Tipo de documento (CPF/CNPJ)', \`document_number\` varchar(20) NULL COMMENT 'Número do documento', \`type\` varchar(20) NULL COMMENT 'Tipo genérico do destinatário (Customer, Business, etc)', \`bank_name\` varchar(255) NULL COMMENT 'Nome do banco', \`bank_ispb\` varchar(20) NULL COMMENT 'ISPB do banco', \`bank_compe\` varchar(20) NULL COMMENT 'Código COMPE do banco', \`account_branch\` varchar(20) NULL COMMENT 'Agência da conta', \`account_number\` varchar(20) NULL COMMENT 'Número da conta', \`account_type\` varchar(20) NULL COMMENT 'Tipo da conta (corrente/poupança)', \`status\` varchar(50) NULL COMMENT 'Status do destinatário no contexto da transação', \`account_status\` varchar(50) NULL COMMENT 'Status da conta bancária', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pix_transfer\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`status\` enum ('CREATED', 'IN_PROCESS', 'APPROVED', 'REPROVED', 'DONE', 'UNDONE', 'CANCELED') NOT NULL COMMENT 'Status da transação PIX' DEFAULT 'CREATED', \`type\` enum ('CREDIT', 'DEBIT') NULL COMMENT 'Tipo de transação (CREDIT = Cash-In, DEBIT = Cash-Out)', \`channel\` varchar(20) NULL COMMENT 'Canal (EXTERNAL, INTERNAL)', \`initialization_type\` enum ('Key', 'StaticQrCode', 'DynamicQrCode', 'Manual') NOT NULL COMMENT 'Tipo de inicialização (Key, StaticQrCode, DynamicQrCode, Manual)', \`end_to_end_id\` varchar(50) NULL COMMENT 'ID do DICT (válido por 15min)', \`pix_key\` varchar(100) NULL COMMENT 'Chave PIX do recebedor', \`transaction_id\` varchar(100) NULL COMMENT 'ID da transação retornado pelo Hiperbanco', \`authentication_code\` varchar(100) NULL COMMENT 'Código de autenticação', \`correlation_id\` varchar(100) NULL COMMENT 'ID de correlação', \`idempotency_key\` varchar(100) NULL COMMENT 'Chave de idempotência enviada no header', \`payment_date\` datetime NULL COMMENT 'Data do pagamento (webhook)', \`is_refund\` tinyint NOT NULL COMMENT 'Indica se é devolução (MED)' DEFAULT 0, \`end_to_end_id_original\` varchar(50) NULL COMMENT 'EndToEndId original (se devolução)', \`refusal_reason\` varchar(255) NULL COMMENT 'Motivo da recusa', \`is_pix_open_banking\` tinyint NOT NULL COMMENT 'Transação via Open Banking' DEFAULT 0, \`is_internal\` tinyint NOT NULL COMMENT 'Transação interna' DEFAULT 0, \`sender_id\` varchar(36) NULL, \`recipient_id\` varchar(36) NULL, INDEX \`IDX_8772005b07bcf29f6fb8b37102\` (\`provider_slug\`), INDEX \`IDX_c2abe5f38c74ac656ca6606dd8\` (\`transaction_id\`), INDEX \`IDX_48f856e17eeea024237fc5e92a\` (\`end_to_end_id\`), INDEX \`IDX_0c07c2ef76c032f922918a2385\` (\`status\`), UNIQUE INDEX \`REL_7cba98316e3294e49fb6fa90a3\` (\`sender_id\`), UNIQUE INDEX \`REL_288e772705fc39eee9cc056784\` (\`recipient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pix_qr_codes\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`encoded_value\` text NOT NULL COMMENT 'Valor codificado do QR Code (base64)', \`type\` enum ('STATIC', 'DYNAMIC') NOT NULL COMMENT 'Tipo do QR Code (STATIC ou DYNAMIC)', \`status\` enum ('CREATED', 'PAID', 'EXPIRED') NOT NULL COMMENT 'Status do QR Code' DEFAULT 'CREATED', \`conciliation_id\` varchar(35) NULL COMMENT 'Identificador de conciliação (alfanumérico)', \`addressing_key_type\` enum ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP') NOT NULL COMMENT 'Tipo da chave PIX', \`addressing_key_value\` varchar(100) NOT NULL COMMENT 'Valor da chave PIX', \`recipient_name\` varchar(250) NULL COMMENT 'Nome do recebedor da transação', \`category_code\` varchar(4) NULL COMMENT 'MCC (Merchant Category Code)' DEFAULT '0000', \`location_city\` varchar(15) NULL COMMENT 'Cidade do recebedor', \`location_zip_code\` varchar(10) NULL COMMENT 'CEP do recebedor', \`single_payment\` tinyint NOT NULL COMMENT 'Indica se é QR Code de pagamento único (apenas DYNAMIC)' DEFAULT 0, \`expires_at\` datetime NULL COMMENT 'Data e hora de expiração do QR Code (apenas DYNAMIC)', \`change_amount_type\` varchar(20) NULL COMMENT 'Indica se o valor pode ser alterado (ALLOWED/NOT_ALLOWED)', \`payer_id\` varchar(36) NULL, INDEX \`IDX_455b800987521b09d82e86b996\` (\`provider_slug\`), INDEX \`IDX_69466de5f3f449ce808f540e2f\` (\`type\`), INDEX \`IDX_1b149258509ba13dda1d86bb05\` (\`status\`), INDEX \`IDX_d296935306dd5982b2c6dfebe4\` (\`conciliation_id\`), UNIQUE INDEX \`REL_15a02b3da70aaf55ab2c7f89df\` (\`payer_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`payment_sender\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NULL COMMENT 'Nome do remetente', \`trade_name\` varchar(255) NULL COMMENT 'Nome fantasia do remetente', \`type\` varchar(20) NULL COMMENT 'Tipo de remetente (Customer, Business)', \`document_type\` varchar(20) NULL COMMENT 'Tipo de documento (CPF/CNPJ)', \`document_number\` varchar(20) NULL COMMENT 'Número do documento', \`bank_name\` varchar(255) NULL COMMENT 'Nome do banco', \`bank_ispb\` varchar(20) NULL COMMENT 'ISPB do banco', \`bank_compe\` varchar(20) NULL COMMENT 'Código COMPE do banco', \`account_branch\` varchar(20) NULL COMMENT 'Agência da conta', \`account_number\` varchar(20) NULL COMMENT 'Número da conta', \`account_type\` varchar(20) NULL COMMENT 'Tipo da conta (corrente/poupança)', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pix_cash_in\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`authentication_code\` varchar(100) NOT NULL COMMENT 'Identificador único da transação (GUID v4)', \`correlation_id\` varchar(100) NULL COMMENT 'ID de correlação do webhook', \`idempotency_key\` varchar(100) NULL COMMENT 'Chave de idempotência do webhook', \`entity_id\` varchar(100) NULL COMMENT 'entityId do webhook', \`status\` enum ('RECEIVED', 'CLEARED', 'FAILED') NOT NULL COMMENT 'Status do PIX Cash-In' DEFAULT 'RECEIVED', \`end_to_end_id\` varchar(50) NULL COMMENT 'Identificador único da transação PIX (DICT)', \`initialization_type\` varchar(30) NULL COMMENT 'Tipo de inicialização: Key, StaticQrCode, DynamicQrCode, Manual', \`receiver_reconciliation_id\` varchar(100) NULL COMMENT 'ID de conciliação do recebedor (QR Code)', \`payment_priority\` varchar(20) NULL COMMENT 'Prioridade: Priority, NonPriority', \`payment_priority_type\` varchar(30) NULL COMMENT 'Tipo de prioridade: Priority, AntifraudAnalysis, ScheduledPayment', \`payment_purpose\` varchar(30) NULL COMMENT 'Propósito: PurchaseOrTransfer, Payment', \`addressing_key_value\` varchar(100) NULL COMMENT 'Valor da chave PIX', \`addressing_key_type\` varchar(20) NULL COMMENT 'Tipo: CPF, CNPJ, PHONE, EMAIL, EVP', \`provider_created_at\` datetime NULL COMMENT 'Data de criação no provedor', \`sender_id\` varchar(36) NULL, \`recipient_id\` varchar(36) NULL, INDEX \`IDX_171a6698c20615a2b67a7539af\` (\`client_id\`), INDEX \`IDX_c215253e986e01840f3e3409f4\` (\`account_id\`), INDEX \`IDX_2d2c97d4a92a97d502243ddf2d\` (\`status\`), INDEX \`IDX_b7218e9d7999ab55872ce42fcc\` (\`end_to_end_id\`), UNIQUE INDEX \`IDX_a217e8ab7514eb5d5cc6e4dabb\` (\`authentication_code\`), UNIQUE INDEX \`REL_aaa9c8b2bcb21ae52b7c7faa5e\` (\`sender_id\`), UNIQUE INDEX \`REL_ba6f3695c324d9f062db316f1e\` (\`recipient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`boleto_payer\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NULL COMMENT 'Nome do pagador', \`trade_name\` varchar(255) NULL COMMENT 'Nome fantasia do pagador', \`document\` varchar(20) NULL COMMENT 'Documento do pagador (CPF/CNPJ)', \`address\` json NULL COMMENT 'Endereço completo do pagador', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`boleto\` (\`id\` varchar(36) NOT NULL, \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da operação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da operação', \`provider_slug\` enum ('hiperbanco') NOT NULL COMMENT 'Identificador do provedor financeiro', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`account_id\` varchar(255) NOT NULL COMMENT 'ID da conta associada', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`alias\` varchar(255) NULL COMMENT 'Nome para identificar o boleto externamente', \`type\` enum ('Deposit', 'Levy') NOT NULL COMMENT 'Tipo de boleto (Deposit ou Levy)', \`status\` enum ('Failure', 'Processing', 'Pending', 'Approved', 'Paid', 'Expired', 'Cancelled', 'Overdue', 'Registered') NOT NULL COMMENT 'Status atual do boleto' DEFAULT 'Pending', \`due_date\` date NOT NULL COMMENT 'Data de vencimento do boleto', \`close_payment\` date NULL COMMENT 'Data limite para pagamento após vencimento', \`document_number\` varchar(20) NOT NULL COMMENT 'Número do documento (CPF ou CNPJ) do beneficiário final', \`account_number\` varchar(50) NOT NULL COMMENT 'Número da conta do beneficiário', \`account_branch\` varchar(10) NOT NULL COMMENT 'Número da agência do beneficiário', \`interest_start_date\` date NULL COMMENT 'Data de início para cálculo dos juros', \`interest_value\` decimal(10,2) NULL COMMENT 'Valor dos juros', \`interest_type\` enum ('FixedAmount', 'Percent') NULL COMMENT 'Tipo de regra para cálculo dos juros', \`fine_start_date\` date NULL COMMENT 'Data de início para cálculo da multa', \`fine_value\` decimal(10,2) NULL COMMENT 'Valor da multa', \`fine_type\` enum ('FixedAmount', 'Percent') NULL COMMENT 'Tipo de regra aplicada à multa', \`discount_limit_date\` date NULL COMMENT 'Data limite para incidência de desconto', \`discount_value\` decimal(10,2) NULL COMMENT 'Valor do desconto', \`discount_type\` enum ('FixedAmountUntilLimitDate', 'FixedPercentUntilLimitDate') NULL COMMENT 'Tipo de regra para cálculo do desconto', \`authentication_code\` varchar(255) NULL COMMENT 'Código de autenticação recebido via webhook', \`barcode\` varchar(100) NULL COMMENT 'Código de barras recebido via webhook', \`digitable\` varchar(100) NULL COMMENT 'Linha digitável recebida via webhook', \`our_number\` varchar(50) NULL COMMENT 'Número do nosso número do boleto', \`payments\` json NULL COMMENT 'Array de pagamentos do boleto recebido do Hiperbanco (pode ser null por muito tempo)', \`cancel_reason\` varchar(50) NULL COMMENT 'Motivo: CancelledByRecipient, CancelledByDeadLine', \`payer_id\` varchar(36) NULL, INDEX \`IDX_ca27740c7519af588f8aa35c07\` (\`provider_slug\`), INDEX \`IDX_747cb4d86228fec7cdb8f357da\` (\`due_date\`), INDEX \`IDX_5346d8339aeccd53b6b3d7a86e\` (\`status\`), UNIQUE INDEX \`REL_3f59272ad47d5ba476f5344f21\` (\`payer_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`transaction\` (\`id\` varchar(36) NOT NULL, \`authentication_code\` varchar(100) NOT NULL COMMENT 'Identificador único da transação no provedor (GUID v4)', \`correlation_id\` varchar(100) NULL COMMENT 'ID de correlação do webhook para rastreamento', \`idempotency_key\` varchar(100) NULL COMMENT 'Chave de idempotência do webhook', \`entity_id\` varchar(100) NULL COMMENT 'entityId do webhook', \`type\` enum ('PIX_CASH_IN', 'PIX_CASH_OUT', 'PIX_REFUND', 'BOLETO_CASH_IN', 'BILL_PAYMENT', 'TED_IN', 'TED_OUT') NOT NULL COMMENT 'Tipo da operação financeira', \`status\` enum ('CREATED', 'PENDING', 'IN_PROCESS', 'DONE', 'UNDONE', 'CANCELED', 'FAILED', 'REFUND_PENDING', 'REFUNDED', 'REPROVED') NOT NULL COMMENT 'Status padronizado para extratos' DEFAULT 'PENDING', \`amount\` decimal(15,2) NOT NULL COMMENT 'Valor da transação', \`currency\` varchar(3) NOT NULL COMMENT 'Código da moeda (ISO 4217)' DEFAULT 'BRL', \`description\` varchar(140) NULL COMMENT 'Descrição da transação', \`pix_cash_in_id\` varchar(255) NULL COMMENT 'Referência para PixCashIn', \`pix_transfer_id\` varchar(255) NULL COMMENT 'Referência para PixTransfer', \`pix_refund_id\` varchar(255) NULL COMMENT 'Referência para PixRefund', \`boleto_id\` varchar(255) NULL COMMENT 'Referência para Boleto', \`bill_payment_id\` varchar(255) NULL COMMENT 'Referência para BillPayment', \`pix_qr_code_id\` varchar(255) NULL COMMENT 'Referência para PixQrCode', \`ted_transfer_id\` varchar(255) NULL COMMENT 'Referência para TedTransfer', \`ted_cash_in_id\` varchar(255) NULL COMMENT 'Referência para TedCashIn', \`ted_refund_id\` varchar(255) NULL COMMENT 'Referência para TedRefund', \`account_id\` varchar(255) NULL COMMENT 'Conta associada para extratos', \`client_id\` varchar(255) NOT NULL COMMENT 'Cliente associado', \`provider_timestamp\` datetime NULL COMMENT 'Timestamp do webhook do provedor', \`created_at\` datetime(6) NOT NULL COMMENT 'Data de criação do registro' DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL COMMENT 'Data de atualização do registro' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL COMMENT 'Data de exclusão do registro', INDEX \`IDX_f27897645ddfa549053e032b9b\` (\`account_id\`, \`type\`, \`created_at\`), INDEX \`IDX_ac1c2e54e94fddfcc77737beef\` (\`account_id\`, \`created_at\`), INDEX \`IDX_7759cdd1dc3b38748ce4fbfa74\` (\`client_id\`, \`status\`, \`created_at\`), INDEX \`IDX_bda22d36fcfd9f77fbe83ca73a\` (\`ted_refund_id\`), INDEX \`IDX_e62fae4883da8959d6717918ca\` (\`ted_cash_in_id\`), INDEX \`IDX_c2482021a455f99cb475ea53e9\` (\`ted_transfer_id\`), INDEX \`IDX_bd4c360c8e5745e921df060744\` (\`created_at\`), INDEX \`IDX_63f749fc7f7178ae1ad85d3b95\` (\`status\`), INDEX \`IDX_cce9f3db01ff7df5db4d337869\` (\`type\`), INDEX \`IDX_3e4cf3f31643825f80f28f929e\` (\`client_id\`), INDEX \`IDX_e2652fa8c16723c83a00fb9b17\` (\`account_id\`), UNIQUE INDEX \`IDX_bb672733f9c5463e6b48a14bb3\` (\`authentication_code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`webhook\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(50) NOT NULL COMMENT 'Nome do webhook definido pelo usuário', \`context\` enum ('Boleto', 'Pix', 'Ted', 'Payment', 'Account', 'Authorization', 'Card', 'Customer', 'Business', 'Document', 'Dict', 'Slc', 'OpenFinance') NOT NULL COMMENT 'Contexto do evento (ex: Boleto, Pix)', \`event_name\` varchar(255) NOT NULL COMMENT 'Nome do evento assinado', \`uri\` varchar(500) NOT NULL COMMENT 'Endpoint de callback para receber eventos', \`provider_slug\` varchar(50) NOT NULL COMMENT 'Identificador do provedor financeiro', \`external_id\` varchar(255) NULL COMMENT 'ID retornado pelo provedor ao registrar o webhook', \`public_key\` text NULL COMMENT 'Chave pública para validação de assinatura', \`registration_callback_uri\` varchar(500) NULL COMMENT 'Endpoint de callback para sucesso de cadastro de webhook', \`registration_callback_secret\` varchar(255) NULL COMMENT 'Segredo HMAC para assinatura do webhook de sucesso de cadastro', \`is_active\` tinyint NOT NULL COMMENT 'Status do webhook' DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`webhook_event_log\` (\`id\` varchar(36) NOT NULL, \`authentication_code\` varchar(100) NOT NULL COMMENT 'Código de autenticação da transação no provedor', \`entity_type\` varchar(50) NOT NULL COMMENT 'Tipo da entidade relacionada', \`entity_id\` varchar(255) NULL COMMENT 'ID da entidade relacionada', \`event_name\` varchar(50) NOT NULL COMMENT 'Nome do evento de webhook recebido', \`was_processed\` tinyint NOT NULL COMMENT 'Se o evento foi processado com sucesso' DEFAULT 1, \`skip_reason\` varchar(255) NULL COMMENT 'Motivo se não foi processado', \`payload\` json NULL COMMENT 'Payload original do webhook', \`provider_timestamp\` datetime NULL COMMENT 'Timestamp do evento no provedor', \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente proprietário', \`created_at\` datetime(6) NOT NULL COMMENT 'Data de criação do registro' DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_42adaece1952f22be573f26f1f\` (\`created_at\`), INDEX \`IDX_22abdce13fabf3964ac4139a8b\` (\`client_id\`), INDEX \`IDX_b144813b35db4b9e873e8defe3\` (\`entity_type\`, \`entity_id\`), INDEX \`IDX_d17b1328fb2e40308b31020204\` (\`authentication_code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`permission\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL COMMENT 'Nome da permissão (ex: user:read)', \`module\` varchar(100) NOT NULL COMMENT 'Módulo da permissão (ex: user, employee)', \`action\` varchar(50) NOT NULL COMMENT 'Ação da permissão (ex: read, write, create)', \`description\` text NULL COMMENT 'Descrição da permissão', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_6aab65e9a6d63e7b0efdb5f0c2\` (\`module\`, \`action\`), UNIQUE INDEX \`IDX_240853a0c3353c25fb12434ad3\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`role_permission\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`role_id\` varchar(36) NULL, \`permission_id\` varchar(36) NULL, INDEX \`IDX_e3a3ba47b7ca00fd23be4ebd6c\` (\`permission_id\`), INDEX \`IDX_3d0a7155eafd75ddba5a701336\` (\`role_id\`), UNIQUE INDEX \`IDX_f7c47ad384a95ad0c454b52990\` (\`role_id\`, \`permission_id\`, \`deleted_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`role\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL COMMENT 'Nome da role', \`description\` text NULL COMMENT 'Descrição da role', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`client_role\` (\`id\` varchar(36) NOT NULL, \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`role_id\` varchar(255) NOT NULL COMMENT 'ID da role', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_be023b46b2d0c0162a5cf217f2\` (\`role_id\`), INDEX \`IDX_a882d7038aec723a7b00a1f6b0\` (\`client_id\`), UNIQUE INDEX \`IDX_f1d1a174d68883f249dcf0e920\` (\`client_id\`, \`role_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`client_permission\` (\`id\` varchar(36) NOT NULL, \`client_id\` varchar(255) NOT NULL COMMENT 'ID do cliente', \`permission_id\` varchar(255) NOT NULL COMMENT 'ID da permissão (scope)', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_9d901fc0e58bfc968ed2181b39\` (\`permission_id\`), INDEX \`IDX_1ee18afb420843c8d4164335ab\` (\`client_id\`), UNIQUE INDEX \`IDX_f75b048d63ae2aa7f4cd67275c\` (\`client_id\`, \`permission_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`internal_user\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(100) NOT NULL COMMENT 'Nome de usuário único', \`email\` varchar(255) NOT NULL COMMENT 'Email do usuário', \`password\` varchar(255) NOT NULL COMMENT 'Senha hasheada', \`name\` varchar(255) NOT NULL COMMENT 'Nome completo do usuário', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_f218c2ea078a637699d4d49269\` (\`email\`), UNIQUE INDEX \`IDX_6df8fc4fe879ece2a0d3d64452\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`provider_credentials\` (\`id\` varchar(36) NOT NULL, \`provider_slug\` varchar(50) NOT NULL COMMENT 'Identificador do provedor (ex: hiperbanco)', \`login_type\` enum ('backoffice', 'bank') NOT NULL COMMENT 'Tipo de login: backoffice (email/senha) ou bank (documento/senha)', \`login\` varchar(255) NOT NULL COMMENT 'Usuário/Email para login', \`password\` text NOT NULL COMMENT 'Senha criptografada', \`client_id\` varchar(255) NULL COMMENT 'ID do cliente multi-tenant', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_3a141bdcdfce0bf441911ec7f3\` (\`provider_slug\`, \`login_type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`audit_log\` (\`id\` varchar(36) NOT NULL, \`action\` enum ('USER_CREATED', 'USER_LOGIN', 'USER_LOGIN_FAILED', 'USER_DELETED', 'USER_PASSWORD_CHANGED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'ROLE_ASSIGNED', 'ROLE_REMOVED', 'PROVIDER_CREDENTIAL_CREATED', 'WEBHOOK_REGISTERED', 'WEBHOOK_UPDATED', 'WEBHOOK_DELETED', 'BOLETO_CREATED', 'BOLETO_CANCELLED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED', 'BILL_PAYMENT_VALIDATED', 'BILL_PAYMENT_CONFIRMED', 'PIX_KEY_REGISTERED', 'PIX_KEY_DELETED', 'PIX_TRANSFER_CREATED', 'PIX_QRCODE_CREATED', 'TED_TRANSFER_CREATED') NOT NULL COMMENT 'Ação realizada', \`entity_type\` varchar(100) NOT NULL COMMENT 'Tipo da entidade (ex: User, Employee)', \`entity_id\` varchar(36) NULL COMMENT 'ID da entidade afetada', \`user_id\` varchar(36) NULL COMMENT 'ID do usuário que realizou a ação', \`username\` varchar(255) NULL COMMENT 'Nome de usuário que realizou a ação', \`correlation_id\` varchar(36) NULL COMMENT 'ID de correlação da requisição', \`old_values\` json NULL COMMENT 'Valores anteriores da entidade', \`new_values\` json NULL COMMENT 'Valores novos da entidade', \`ip_address\` varchar(45) NULL COMMENT 'Endereço IP do cliente', \`user_agent\` text NULL COMMENT 'User agent do cliente', \`description\` text NULL COMMENT 'Descrição adicional da ação', \`status\` enum ('Success', 'Failure') NOT NULL COMMENT 'Status da operação' DEFAULT 'Success', \`error_message\` text NULL COMMENT 'Mensagem de erro, se a operação falhou', \`error_code\` varchar(100) NULL COMMENT 'Código do erro, se a operação falhou', \`created_at\` datetime(6) NOT NULL COMMENT 'Data e hora da criação do log' DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_279c2f0ef471f2ddbdea4790e6\` (\`status\`), INDEX \`IDX_be1cc5ca1752801131dd5321f2\` (\`correlation_id\`), INDEX \`IDX_2ad7930a7c2af80585c8c1b770\` (\`created_at\`), INDEX \`IDX_951e6339a77994dfbad976b35c\` (\`action\`), INDEX \`IDX_cb11bd5b662431ea0ac455a27d\` (\`user_id\`), INDEX \`IDX_9dee3678d9e3942b6424e5b07b\` (\`entity_type\`, \`entity_id\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`backoffice_users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`status\` enum ('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE', \`secret_answer\` varchar(255) NULL, \`client_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_f656ea17fafcd5b3acba3eaa7c\` (\`email\`, \`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`webhook_configuration\` (\`id\` varchar(36) NOT NULL, \`client_id\` varchar(255) NOT NULL COMMENT 'FK para o cliente dono desta configuração', \`event_type\` varchar(100) NOT NULL COMMENT 'Tipo de evento interno da api-payment', \`url\` varchar(500) NOT NULL COMMENT 'URL de destino do cliente (deve ser HTTPS)', \`public_key\` varchar(255) NOT NULL COMMENT 'Chave pública enviada no header Authorization e usada na string assinada', \`private_key\` varchar(255) NOT NULL COMMENT 'Segredo HMAC usado para gerar a assinatura (nunca retornado em consultas)', \`is_active\` tinyint NOT NULL COMMENT 'Apenas configurações ativas recebem eventos' DEFAULT 1, \`circuit_breaker_failure_count\` int NOT NULL COMMENT 'Falhas consecutivas desde o último sucesso' DEFAULT '0', \`circuit_breaker_open_until\` datetime NULL COMMENT 'null = circuito fechado; preenchido = bloqueado até este momento', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_39a1d5eacf4ea30c3203a359a8\` (\`client_id\`, \`is_active\`), INDEX \`IDX_9b15987c24579c417e4d4f9ccb\` (\`client_id\`, \`event_type\`), INDEX \`IDX_2a3ecbb5ca57175428f7bbdc9f\` (\`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`webhook_message\` (\`id\` varchar(36) NOT NULL, \`configuration_id\` varchar(255) NOT NULL COMMENT 'FK para webhook_configuration', \`client_id\` varchar(255) NOT NULL COMMENT 'Desnormalizado para consultas rápidas', \`event_type\` varchar(100) NOT NULL COMMENT 'Evento interno da api-payment', \`provider_event_name\` varchar(100) NOT NULL COMMENT 'Valor original do WebhookEvent enum do provider', \`provider_slug\` varchar(50) NOT NULL COMMENT 'Identificador do provider financeiro', \`payload\` json NOT NULL COMMENT 'Array completo do payload enviado ao cliente', \`status\` varchar(50) NOT NULL COMMENT 'Estado atual da mensagem' DEFAULT 'PENDING', \`attempt_count\` int NOT NULL COMMENT 'Número de tentativas de entrega realizadas' DEFAULT '0', \`last_attempted_at\` datetime NULL, \`delivered_at\` datetime NULL, \`last_error\` text NULL COMMENT 'Última mensagem de erro na entrega', \`response_status_code\` int NULL COMMENT 'HTTP status code da última tentativa', \`correlation_id\` varchar(100) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_e202fba5c070d40636482574f2\` (\`provider_event_name\`), INDEX \`IDX_83ba27d11cfd8b3f8cf3e5c214\` (\`created_at\`), INDEX \`IDX_d2646412eb488390025484ad52\` (\`status\`), INDEX \`IDX_099ce8aabcf54092fd5f5c4536\` (\`client_id\`), INDEX \`IDX_0125a66cf88ab57873fd6b5040\` (\`configuration_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`onboarding\` ADD CONSTRAINT \`FK_cfe7cc424013641481aac70658e\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` ADD CONSTRAINT \`FK_45a1670bb3c856a6ba08ec3c737\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` ADD CONSTRAINT \`FK_6749b954c82bd3e886527f79e4a\` FOREIGN KEY (\`onboarding_id\`) REFERENCES \`onboarding\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` ADD CONSTRAINT \`FK_f80e6e1cc7f0f88a657f2961465\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` ADD CONSTRAINT \`FK_e9189c18b6661deb3fd31fc4d87\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` ADD CONSTRAINT \`FK_cf47025d94721a3f2fafe7e0c1f\` FOREIGN KEY (\`sender_id\`) REFERENCES \`payment_sender\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` ADD CONSTRAINT \`FK_f98abc6e9840c9db21b73a839a9\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`payment_recipient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` ADD CONSTRAINT \`FK_dfb3bced6cb7c3e6d3fbca23935\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` ADD CONSTRAINT \`FK_daa819b0d0d36247b69f77695e4\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` ADD CONSTRAINT \`FK_71b22f7e813d06283450818f247\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`payment_recipient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` ADD CONSTRAINT \`FK_8036ebc3865a691fe2ca6ae8349\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` ADD CONSTRAINT \`FK_2ab9c770863a109b275f3adaa4e\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` ADD CONSTRAINT \`FK_79e0ed72b3191b814a397aafe48\` FOREIGN KEY (\`sender_id\`) REFERENCES \`payment_sender\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` ADD CONSTRAINT \`FK_9252c2e59e0b5d74d9445a144ab\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`payment_recipient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` ADD CONSTRAINT \`FK_db09e3e5f60bab2b78b9bc71a04\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` ADD CONSTRAINT \`FK_1f489e5b8b7732bb0384ed5468d\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` ADD CONSTRAINT \`FK_163c198b83ae70cb6bdab1058a6\` FOREIGN KEY (\`sender_id\`) REFERENCES \`payment_sender\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` ADD CONSTRAINT \`FK_13dd4fa827b97259f8f1ab9d18b\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`payment_recipient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` ADD CONSTRAINT \`FK_c88eede3e453f82afbbf1fb9b1e\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` ADD CONSTRAINT \`FK_94949d7d7c253860be62ae14d1a\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` ADD CONSTRAINT \`FK_9151297b6f39259725c4f1fb254\` FOREIGN KEY (\`sender_id\`) REFERENCES \`payment_sender\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` ADD CONSTRAINT \`FK_24ba584ff3ccbab527ca59d7f5d\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`payment_recipient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` ADD CONSTRAINT \`FK_9fca5d87883692dfa094b710efc\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` ADD CONSTRAINT \`FK_95e24cd75b764d63bece3ffe92a\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` ADD CONSTRAINT \`FK_7cba98316e3294e49fb6fa90a3d\` FOREIGN KEY (\`sender_id\`) REFERENCES \`payment_sender\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` ADD CONSTRAINT \`FK_288e772705fc39eee9cc0567849\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`payment_recipient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_qr_codes\` ADD CONSTRAINT \`FK_c52db791ff90c58e6e6ac21a09f\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_qr_codes\` ADD CONSTRAINT \`FK_900c068df3d57ceed1ade137a4d\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_qr_codes\` ADD CONSTRAINT \`FK_15a02b3da70aaf55ab2c7f89dfe\` FOREIGN KEY (\`payer_id\`) REFERENCES \`payment_sender\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` ADD CONSTRAINT \`FK_171a6698c20615a2b67a7539af3\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` ADD CONSTRAINT \`FK_c215253e986e01840f3e3409f48\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` ADD CONSTRAINT \`FK_aaa9c8b2bcb21ae52b7c7faa5e5\` FOREIGN KEY (\`sender_id\`) REFERENCES \`payment_sender\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` ADD CONSTRAINT \`FK_ba6f3695c324d9f062db316f1e0\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`payment_recipient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` ADD CONSTRAINT \`FK_e8ffe166055b2c41a7141bd885b\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` ADD CONSTRAINT \`FK_9a071095207dd2e25b623f4852f\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` ADD CONSTRAINT \`FK_3f59272ad47d5ba476f5344f21f\` FOREIGN KEY (\`payer_id\`) REFERENCES \`boleto_payer\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_dbab3ad529d26361c605ade2827\` FOREIGN KEY (\`pix_cash_in_id\`) REFERENCES \`pix_cash_in\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_4175e6793f2a7735638000c7d58\` FOREIGN KEY (\`pix_transfer_id\`) REFERENCES \`pix_transfer\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_e7d78b6e81f05b70dd2c3c58b5e\` FOREIGN KEY (\`pix_refund_id\`) REFERENCES \`pix_refund\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_06843f8a685e17cee723a5ef216\` FOREIGN KEY (\`boleto_id\`) REFERENCES \`boleto\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_fa5f594128c08753752a18e87b7\` FOREIGN KEY (\`bill_payment_id\`) REFERENCES \`bill_payment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_b31163f597643d2ae00047a85f2\` FOREIGN KEY (\`pix_qr_code_id\`) REFERENCES \`pix_qr_codes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_c2482021a455f99cb475ea53e98\` FOREIGN KEY (\`ted_transfer_id\`) REFERENCES \`ted_transfer\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_e62fae4883da8959d6717918ca0\` FOREIGN KEY (\`ted_cash_in_id\`) REFERENCES \`ted_cash_in\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_bda22d36fcfd9f77fbe83ca73a6\` FOREIGN KEY (\`ted_refund_id\`) REFERENCES \`ted_refund\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_e2652fa8c16723c83a00fb9b17e\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_3e4cf3f31643825f80f28f929e2\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`webhook_event_log\` ADD CONSTRAINT \`FK_22abdce13fabf3964ac4139a8b5\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permission\` ADD CONSTRAINT \`FK_3d0a7155eafd75ddba5a7013368\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permission\` ADD CONSTRAINT \`FK_e3a3ba47b7ca00fd23be4ebd6cf\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permission\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_role\` ADD CONSTRAINT \`FK_a882d7038aec723a7b00a1f6b08\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_role\` ADD CONSTRAINT \`FK_be023b46b2d0c0162a5cf217f25\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_permission\` ADD CONSTRAINT \`FK_1ee18afb420843c8d4164335abe\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_permission\` ADD CONSTRAINT \`FK_9d901fc0e58bfc968ed2181b39c\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permission\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`provider_credentials\` ADD CONSTRAINT \`FK_761708c096aed4b690ec9df6b7d\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`backoffice_users\` ADD CONSTRAINT \`FK_7d59ff018e629a9ffc5aa40d34a\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`webhook_configuration\` ADD CONSTRAINT \`FK_2a3ecbb5ca57175428f7bbdc9ff\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`webhook_message\` ADD CONSTRAINT \`FK_0125a66cf88ab57873fd6b50407\` FOREIGN KEY (\`configuration_id\`) REFERENCES \`webhook_configuration\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`webhook_message\` DROP FOREIGN KEY \`FK_0125a66cf88ab57873fd6b50407\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`webhook_configuration\` DROP FOREIGN KEY \`FK_2a3ecbb5ca57175428f7bbdc9ff\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`backoffice_users\` DROP FOREIGN KEY \`FK_7d59ff018e629a9ffc5aa40d34a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`provider_credentials\` DROP FOREIGN KEY \`FK_761708c096aed4b690ec9df6b7d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_permission\` DROP FOREIGN KEY \`FK_9d901fc0e58bfc968ed2181b39c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_permission\` DROP FOREIGN KEY \`FK_1ee18afb420843c8d4164335abe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_role\` DROP FOREIGN KEY \`FK_be023b46b2d0c0162a5cf217f25\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_role\` DROP FOREIGN KEY \`FK_a882d7038aec723a7b00a1f6b08\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permission\` DROP FOREIGN KEY \`FK_e3a3ba47b7ca00fd23be4ebd6cf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permission\` DROP FOREIGN KEY \`FK_3d0a7155eafd75ddba5a7013368\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`webhook_event_log\` DROP FOREIGN KEY \`FK_22abdce13fabf3964ac4139a8b5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_3e4cf3f31643825f80f28f929e2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_e2652fa8c16723c83a00fb9b17e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_bda22d36fcfd9f77fbe83ca73a6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_e62fae4883da8959d6717918ca0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_c2482021a455f99cb475ea53e98\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_b31163f597643d2ae00047a85f2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_fa5f594128c08753752a18e87b7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_06843f8a685e17cee723a5ef216\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_e7d78b6e81f05b70dd2c3c58b5e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_4175e6793f2a7735638000c7d58\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_dbab3ad529d26361c605ade2827\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` DROP FOREIGN KEY \`FK_3f59272ad47d5ba476f5344f21f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` DROP FOREIGN KEY \`FK_9a071095207dd2e25b623f4852f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`boleto\` DROP FOREIGN KEY \`FK_e8ffe166055b2c41a7141bd885b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` DROP FOREIGN KEY \`FK_ba6f3695c324d9f062db316f1e0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` DROP FOREIGN KEY \`FK_aaa9c8b2bcb21ae52b7c7faa5e5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` DROP FOREIGN KEY \`FK_c215253e986e01840f3e3409f48\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_cash_in\` DROP FOREIGN KEY \`FK_171a6698c20615a2b67a7539af3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_qr_codes\` DROP FOREIGN KEY \`FK_15a02b3da70aaf55ab2c7f89dfe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_qr_codes\` DROP FOREIGN KEY \`FK_900c068df3d57ceed1ade137a4d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_qr_codes\` DROP FOREIGN KEY \`FK_c52db791ff90c58e6e6ac21a09f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` DROP FOREIGN KEY \`FK_288e772705fc39eee9cc0567849\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` DROP FOREIGN KEY \`FK_7cba98316e3294e49fb6fa90a3d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` DROP FOREIGN KEY \`FK_95e24cd75b764d63bece3ffe92a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` DROP FOREIGN KEY \`FK_9fca5d87883692dfa094b710efc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` DROP FOREIGN KEY \`FK_24ba584ff3ccbab527ca59d7f5d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` DROP FOREIGN KEY \`FK_9151297b6f39259725c4f1fb254\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` DROP FOREIGN KEY \`FK_94949d7d7c253860be62ae14d1a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_refund\` DROP FOREIGN KEY \`FK_c88eede3e453f82afbbf1fb9b1e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` DROP FOREIGN KEY \`FK_13dd4fa827b97259f8f1ab9d18b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` DROP FOREIGN KEY \`FK_163c198b83ae70cb6bdab1058a6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` DROP FOREIGN KEY \`FK_1f489e5b8b7732bb0384ed5468d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_cash_in\` DROP FOREIGN KEY \`FK_db09e3e5f60bab2b78b9bc71a04\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` DROP FOREIGN KEY \`FK_9252c2e59e0b5d74d9445a144ab\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` DROP FOREIGN KEY \`FK_79e0ed72b3191b814a397aafe48\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` DROP FOREIGN KEY \`FK_2ab9c770863a109b275f3adaa4e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ted_transfer\` DROP FOREIGN KEY \`FK_8036ebc3865a691fe2ca6ae8349\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` DROP FOREIGN KEY \`FK_71b22f7e813d06283450818f247\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` DROP FOREIGN KEY \`FK_daa819b0d0d36247b69f77695e4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bill_payment\` DROP FOREIGN KEY \`FK_dfb3bced6cb7c3e6d3fbca23935\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` DROP FOREIGN KEY \`FK_f98abc6e9840c9db21b73a839a9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` DROP FOREIGN KEY \`FK_cf47025d94721a3f2fafe7e0c1f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` DROP FOREIGN KEY \`FK_e9189c18b6661deb3fd31fc4d87\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_refund\` DROP FOREIGN KEY \`FK_f80e6e1cc7f0f88a657f2961465\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_6749b954c82bd3e886527f79e4a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_45a1670bb3c856a6ba08ec3c737\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`onboarding\` DROP FOREIGN KEY \`FK_cfe7cc424013641481aac70658e\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0125a66cf88ab57873fd6b5040\` ON \`webhook_message\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_099ce8aabcf54092fd5f5c4536\` ON \`webhook_message\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d2646412eb488390025484ad52\` ON \`webhook_message\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_83ba27d11cfd8b3f8cf3e5c214\` ON \`webhook_message\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e202fba5c070d40636482574f2\` ON \`webhook_message\``,
    );
    await queryRunner.query(`DROP TABLE \`webhook_message\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2a3ecbb5ca57175428f7bbdc9f\` ON \`webhook_configuration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9b15987c24579c417e4d4f9ccb\` ON \`webhook_configuration\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_39a1d5eacf4ea30c3203a359a8\` ON \`webhook_configuration\``,
    );
    await queryRunner.query(`DROP TABLE \`webhook_configuration\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f656ea17fafcd5b3acba3eaa7c\` ON \`backoffice_users\``,
    );
    await queryRunner.query(`DROP TABLE \`backoffice_users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9dee3678d9e3942b6424e5b07b\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_cb11bd5b662431ea0ac455a27d\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_951e6339a77994dfbad976b35c\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2ad7930a7c2af80585c8c1b770\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_be1cc5ca1752801131dd5321f2\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_279c2f0ef471f2ddbdea4790e6\` ON \`audit_log\``,
    );
    await queryRunner.query(`DROP TABLE \`audit_log\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_3a141bdcdfce0bf441911ec7f3\` ON \`provider_credentials\``,
    );
    await queryRunner.query(`DROP TABLE \`provider_credentials\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_6df8fc4fe879ece2a0d3d64452\` ON \`internal_user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f218c2ea078a637699d4d49269\` ON \`internal_user\``,
    );
    await queryRunner.query(`DROP TABLE \`internal_user\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f75b048d63ae2aa7f4cd67275c\` ON \`client_permission\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1ee18afb420843c8d4164335ab\` ON \`client_permission\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9d901fc0e58bfc968ed2181b39\` ON \`client_permission\``,
    );
    await queryRunner.query(`DROP TABLE \`client_permission\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f1d1a174d68883f249dcf0e920\` ON \`client_role\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a882d7038aec723a7b00a1f6b0\` ON \`client_role\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_be023b46b2d0c0162a5cf217f2\` ON \`client_role\``,
    );
    await queryRunner.query(`DROP TABLE \`client_role\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\``,
    );
    await queryRunner.query(`DROP TABLE \`role\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f7c47ad384a95ad0c454b52990\` ON \`role_permission\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3d0a7155eafd75ddba5a701336\` ON \`role_permission\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e3a3ba47b7ca00fd23be4ebd6c\` ON \`role_permission\``,
    );
    await queryRunner.query(`DROP TABLE \`role_permission\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_240853a0c3353c25fb12434ad3\` ON \`permission\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6aab65e9a6d63e7b0efdb5f0c2\` ON \`permission\``,
    );
    await queryRunner.query(`DROP TABLE \`permission\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d17b1328fb2e40308b31020204\` ON \`webhook_event_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b144813b35db4b9e873e8defe3\` ON \`webhook_event_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_22abdce13fabf3964ac4139a8b\` ON \`webhook_event_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_42adaece1952f22be573f26f1f\` ON \`webhook_event_log\``,
    );
    await queryRunner.query(`DROP TABLE \`webhook_event_log\``);
    await queryRunner.query(`DROP TABLE \`webhook\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_bb672733f9c5463e6b48a14bb3\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e2652fa8c16723c83a00fb9b17\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3e4cf3f31643825f80f28f929e\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_cce9f3db01ff7df5db4d337869\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_63f749fc7f7178ae1ad85d3b95\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bd4c360c8e5745e921df060744\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c2482021a455f99cb475ea53e9\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e62fae4883da8959d6717918ca\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bda22d36fcfd9f77fbe83ca73a\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_7759cdd1dc3b38748ce4fbfa74\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ac1c2e54e94fddfcc77737beef\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f27897645ddfa549053e032b9b\` ON \`transaction\``,
    );
    await queryRunner.query(`DROP TABLE \`transaction\``);
    await queryRunner.query(
      `DROP INDEX \`REL_3f59272ad47d5ba476f5344f21\` ON \`boleto\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_5346d8339aeccd53b6b3d7a86e\` ON \`boleto\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_747cb4d86228fec7cdb8f357da\` ON \`boleto\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ca27740c7519af588f8aa35c07\` ON \`boleto\``,
    );
    await queryRunner.query(`DROP TABLE \`boleto\``);
    await queryRunner.query(`DROP TABLE \`boleto_payer\``);
    await queryRunner.query(
      `DROP INDEX \`REL_ba6f3695c324d9f062db316f1e\` ON \`pix_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_aaa9c8b2bcb21ae52b7c7faa5e\` ON \`pix_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a217e8ab7514eb5d5cc6e4dabb\` ON \`pix_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b7218e9d7999ab55872ce42fcc\` ON \`pix_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2d2c97d4a92a97d502243ddf2d\` ON \`pix_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c215253e986e01840f3e3409f4\` ON \`pix_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_171a6698c20615a2b67a7539af\` ON \`pix_cash_in\``,
    );
    await queryRunner.query(`DROP TABLE \`pix_cash_in\``);
    await queryRunner.query(`DROP TABLE \`payment_sender\``);
    await queryRunner.query(
      `DROP INDEX \`REL_15a02b3da70aaf55ab2c7f89df\` ON \`pix_qr_codes\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d296935306dd5982b2c6dfebe4\` ON \`pix_qr_codes\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1b149258509ba13dda1d86bb05\` ON \`pix_qr_codes\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_69466de5f3f449ce808f540e2f\` ON \`pix_qr_codes\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_455b800987521b09d82e86b996\` ON \`pix_qr_codes\``,
    );
    await queryRunner.query(`DROP TABLE \`pix_qr_codes\``);
    await queryRunner.query(
      `DROP INDEX \`REL_288e772705fc39eee9cc056784\` ON \`pix_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_7cba98316e3294e49fb6fa90a3\` ON \`pix_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0c07c2ef76c032f922918a2385\` ON \`pix_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_48f856e17eeea024237fc5e92a\` ON \`pix_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c2abe5f38c74ac656ca6606dd8\` ON \`pix_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8772005b07bcf29f6fb8b37102\` ON \`pix_transfer\``,
    );
    await queryRunner.query(`DROP TABLE \`pix_transfer\``);
    await queryRunner.query(`DROP TABLE \`payment_recipient\``);
    await queryRunner.query(
      `DROP INDEX \`REL_24ba584ff3ccbab527ca59d7f5\` ON \`ted_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_9151297b6f39259725c4f1fb25\` ON \`ted_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_badfbb3844c569f73a9044e3a9\` ON \`ted_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_4e7b2edec15f22ab887c64c00e\` ON \`ted_refund\``,
    );
    await queryRunner.query(`DROP TABLE \`ted_refund\``);
    await queryRunner.query(
      `DROP INDEX \`REL_13dd4fa827b97259f8f1ab9d18\` ON \`ted_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_163c198b83ae70cb6bdab1058a\` ON \`ted_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c998f999ad76ef40d696a677a6\` ON \`ted_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bd6de36a47622a702a3b1bf668\` ON \`ted_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1f489e5b8b7732bb0384ed5468\` ON \`ted_cash_in\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_db09e3e5f60bab2b78b9bc71a0\` ON \`ted_cash_in\``,
    );
    await queryRunner.query(`DROP TABLE \`ted_cash_in\``);
    await queryRunner.query(
      `DROP INDEX \`REL_9252c2e59e0b5d74d9445a144a\` ON \`ted_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_79e0ed72b3191b814a397aafe4\` ON \`ted_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_69b7bde531d816ab22f69a02d3\` ON \`ted_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d7a7f865610994eeaded15aab8\` ON \`ted_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_25a44af7908ef49439c2d3a57f\` ON \`ted_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2ab9c770863a109b275f3adaa4\` ON \`ted_transfer\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8036ebc3865a691fe2ca6ae834\` ON \`ted_transfer\``,
    );
    await queryRunner.query(`DROP TABLE \`ted_transfer\``);
    await queryRunner.query(
      `DROP INDEX \`REL_71b22f7e813d06283450818f24\` ON \`bill_payment\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d9184c8543bab80d7234c590b0\` ON \`bill_payment\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c71857b93b295e30b68e478e40\` ON \`bill_payment\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ad344ea2a01ccb4f83dbc4137d\` ON \`bill_payment\``,
    );
    await queryRunner.query(`DROP TABLE \`bill_payment\``);
    await queryRunner.query(
      `DROP INDEX \`REL_f98abc6e9840c9db21b73a839a\` ON \`pix_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_cf47025d94721a3f2fafe7e0c1\` ON \`pix_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c3821ac95356a8c6ff8b51feaa\` ON \`pix_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0521fb3fd441e38e3d2733e787\` ON \`pix_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_762358ff3dbf74f91ca8f55e5a\` ON \`pix_refund\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1811f94fe12ca09f29cdb7bb7d\` ON \`pix_refund\``,
    );
    await queryRunner.query(`DROP TABLE \`pix_refund\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a71e3e0c6bfeb02902702f0ee3\` ON \`account\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_45a1670bb3c856a6ba08ec3c73\` ON \`account\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6749b954c82bd3e886527f79e4\` ON \`account\``,
    );
    await queryRunner.query(`DROP TABLE \`account\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_64dfb6cb08b9c1a2a947f59d5f\` ON \`onboarding\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_cfe7cc424013641481aac70658\` ON \`onboarding\``,
    );
    await queryRunner.query(`DROP TABLE \`onboarding\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_71065dd6aa4640d821bfced4e1\` ON \`client\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_463cae6774e9b085ca966d89b4\` ON \`client\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_76b252c7aad1930be932f9ae5a\` ON \`client\``,
    );
    await queryRunner.query(`DROP TABLE \`client\``);
  }
}
