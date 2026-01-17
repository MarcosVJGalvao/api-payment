import {
  MigrationInterface,
  QueryRunner,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePixQrCodeTable1768406000000 implements MigrationInterface {
  name = 'CreatePixQrCodeTable1768406000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Padronizar collation de TODAS as tabelas para utf8mb4_unicode_ci
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME != 'migrations'
    `);

    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE \`${table.TABLE_NAME}\`
        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
    }

    // Criar tabela pix_qr_codes (se não existir)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`pix_qr_codes\` (
        \`id\` CHAR(36) NOT NULL,
        \`amount\` DECIMAL(15, 2) NOT NULL COMMENT 'Valor da operação',
        \`currency\` VARCHAR(3) NOT NULL DEFAULT 'BRL' COMMENT 'Código da moeda (ISO 4217)',
        \`description\` VARCHAR(140) NULL COMMENT 'Descrição da operação',
        \`provider_slug\` ENUM('HIPERBANCO') NOT NULL COMMENT 'Identificador do provedor financeiro',
        \`client_id\` CHAR(36) NOT NULL COMMENT 'ID do cliente',
        \`account_id\` CHAR(36) NOT NULL COMMENT 'ID da conta associada',
        \`encoded_value\` TEXT NOT NULL COMMENT 'Valor codificado do QR Code (base64)',
        \`type\` ENUM('STATIC', 'DYNAMIC') NOT NULL COMMENT 'Tipo do QR Code (STATIC ou DYNAMIC)',
        \`status\` ENUM('CREATED', 'PAID', 'EXPIRED') NOT NULL DEFAULT 'CREATED' COMMENT 'Status do QR Code',
        \`conciliation_id\` VARCHAR(35) NULL COMMENT 'Identificador de conciliação (alfanumérico)',
        \`addressing_key_type\` ENUM('EMAIL', 'PHONE', 'CPF', 'CNPJ', 'EVP') NOT NULL COMMENT 'Tipo da chave PIX',
        \`addressing_key_value\` VARCHAR(100) NOT NULL COMMENT 'Valor da chave PIX',
        \`recipient_name\` VARCHAR(250) NULL COMMENT 'Nome do recebedor da transação',
        \`category_code\` VARCHAR(4) NULL DEFAULT '0000' COMMENT 'MCC (Merchant Category Code)',
        \`location_city\` VARCHAR(15) NULL COMMENT 'Cidade do recebedor',
        \`location_zip_code\` VARCHAR(10) NULL COMMENT 'CEP do recebedor',
        \`single_payment\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica se é QR Code de pagamento único (apenas DYNAMIC)',
        \`expires_at\` DATETIME NULL COMMENT 'Data e hora de expiração do QR Code (apenas DYNAMIC)',
        \`change_amount_type\` VARCHAR(20) NULL COMMENT 'Indica se o valor pode ser alterado (ALLOWED/NOT_ALLOWED)',
        \`payer_id\` VARCHAR(36) NULL COMMENT 'FK para PaymentSender (pagador do QR Code dinâmico)',
        \`transaction_id\` VARCHAR(100) NULL COMMENT 'ID da transação quando pago',
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` DATETIME(6) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Verificar se a tabela foi recém-criada (não tinha antes)
    const table = await queryRunner.getTable('pix_qr_codes');
    const hasIndexes = table?.indices?.some(
      (i) => i.name === 'IDX_pix_qr_codes_conciliation_id',
    );

    // Criar índices apenas se não existirem
    if (!hasIndexes) {
      await queryRunner.createIndex(
        'pix_qr_codes',
        new TableIndex({
          name: 'IDX_pix_qr_codes_conciliation_id',
          columnNames: ['conciliation_id'],
        }),
      );

      await queryRunner.createIndex(
        'pix_qr_codes',
        new TableIndex({
          name: 'IDX_pix_qr_codes_status',
          columnNames: ['status'],
        }),
      );

      await queryRunner.createIndex(
        'pix_qr_codes',
        new TableIndex({
          name: 'IDX_pix_qr_codes_type',
          columnNames: ['type'],
        }),
      );

      await queryRunner.createIndex(
        'pix_qr_codes',
        new TableIndex({
          name: 'IDX_pix_qr_codes_provider_slug',
          columnNames: ['provider_slug'],
        }),
      );

      await queryRunner.createIndex(
        'pix_qr_codes',
        new TableIndex({
          name: 'IDX_pix_qr_codes_client_id',
          columnNames: ['client_id'],
        }),
      );

      await queryRunner.createIndex(
        'pix_qr_codes',
        new TableIndex({
          name: 'IDX_pix_qr_codes_account_id',
          columnNames: ['account_id'],
        }),
      );

      // Criar foreign keys
      await queryRunner.createForeignKey(
        'pix_qr_codes',
        new TableForeignKey({
          name: 'FK_pix_qr_codes_client',
          columnNames: ['client_id'],
          referencedTableName: 'client',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'pix_qr_codes',
        new TableForeignKey({
          name: 'FK_pix_qr_codes_account',
          columnNames: ['account_id'],
          referencedTableName: 'account',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'pix_qr_codes',
        new TableForeignKey({
          name: 'FK_pix_qr_codes_payer',
          columnNames: ['payer_id'],
          referencedTableName: 'payment_sender',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Adicionar coluna pix_qr_code_id na tabela transaction (se não existir)
    const hasColumn = await queryRunner.hasColumn(
      'transaction',
      'pix_qr_code_id',
    );
    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE \`transaction\`
        ADD COLUMN \`pix_qr_code_id\` CHAR(36) NULL COMMENT 'Referência para PixQrCode'
      `);

      await queryRunner.createIndex(
        'transaction',
        new TableIndex({
          name: 'IDX_transaction_pix_qr_code_id',
          columnNames: ['pix_qr_code_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'transaction',
        new TableForeignKey({
          name: 'FK_transaction_pix_qr_code',
          columnNames: ['pix_qr_code_id'],
          referencedTableName: 'pix_qr_codes',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Update audit_log enum to include PIX QR Code actions
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
        'BILL_PAYMENT_CONFIRMED',
        'PIX_KEY_REGISTERED',
        'PIX_KEY_DELETED',
        'PIX_TRANSFER_CREATED',
        'PIX_QRCODE_CREATED'
      ) NOT NULL COMMENT 'Ação realizada'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert audit_log enum (remove PIX actions added in this migration)
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

    // Remover FK e coluna da tabela transaction
    await queryRunner.dropForeignKey(
      'transaction',
      'FK_transaction_pix_qr_code',
    );
    await queryRunner.dropIndex(
      'transaction',
      'IDX_transaction_pix_qr_code_id',
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP COLUMN \`pix_qr_code_id\``,
    );

    // Remover FKs e índices da tabela pix_qr_codes
    await queryRunner.dropForeignKey('pix_qr_codes', 'FK_pix_qr_codes_payer');
    await queryRunner.dropForeignKey('pix_qr_codes', 'FK_pix_qr_codes_account');
    await queryRunner.dropForeignKey('pix_qr_codes', 'FK_pix_qr_codes_client');
    await queryRunner.dropIndex('pix_qr_codes', 'IDX_pix_qr_codes_account_id');
    await queryRunner.dropIndex('pix_qr_codes', 'IDX_pix_qr_codes_client_id');
    await queryRunner.dropIndex(
      'pix_qr_codes',
      'IDX_pix_qr_codes_provider_slug',
    );
    await queryRunner.dropIndex('pix_qr_codes', 'IDX_pix_qr_codes_type');
    await queryRunner.dropIndex('pix_qr_codes', 'IDX_pix_qr_codes_status');
    await queryRunner.dropIndex(
      'pix_qr_codes',
      'IDX_pix_qr_codes_conciliation_id',
    );

    // Dropar tabela
    await queryRunner.dropTable('pix_qr_codes');
  }
}
