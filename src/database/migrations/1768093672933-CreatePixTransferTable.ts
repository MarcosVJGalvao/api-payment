import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePixTransferTable1768093672933 implements MigrationInterface {
  name = 'CreatePixTransferTable1768093672933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `pix_transfer`');
    await queryRunner.query(
      `CREATE TABLE \`pix_transfer\` (
        \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`status\` enum ('CREATED', 'IN_PROCESS', 'APPROVED', 'REPROVED', 'DONE', 'UNDONE', 'CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Status da transação PIX' DEFAULT 'CREATED',
        \`type\` enum ('CREDIT', 'DEBIT') COLLATE utf8mb4_unicode_ci NULL COMMENT 'Tipo de transação (CREDIT = Cash-In, DEBIT = Cash-Out)',
        \`channel\` varchar(20) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Canal (EXTERNAL, INTERNAL)',
        \`amount\` decimal(10,2) NOT NULL COMMENT 'Valor da transferência',
        \`description\` varchar(140) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Descrição da transferência',
        \`initialization_type\` enum ('Key', 'StaticQrCode', 'DynamicQrCode', 'Manual') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de inicialização (Key, StaticQrCode, DynamicQrCode, Manual)',
        \`end_to_end_id\` varchar(50) COLLATE utf8mb4_unicode_ci NULL COMMENT 'ID do DICT (válido por 15min)',
        \`pix_key\` varchar(100) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Chave PIX do recebedor',
        \`transaction_id\` varchar(100) COLLATE utf8mb4_unicode_ci NULL COMMENT 'ID da transação retornado pelo Hiperbanco',
        \`authentication_code\` varchar(100) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Código de autenticação',
        \`correlation_id\` varchar(100) COLLATE utf8mb4_unicode_ci NULL COMMENT 'ID de correlação',
        \`idempotency_key\` varchar(100) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Chave de idempotência enviada no header',
        \`sender_document_type\` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo do documento do pagador (CPF, CNPJ)',
        \`sender_document_number\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Documento do pagador',
        \`sender_name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nome do pagador',
        \`sender_account_branch\` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Agência do pagador',
        \`sender_account_number\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Conta do pagador',
        \`sender_account_type\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo da conta do pagador',
        \`sender_bank_ispb\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ISPB do banco do pagador',
        \`recipient_document_type\` varchar(10) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Tipo do documento do recebedor',
        \`recipient_document_number\` varchar(20) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Documento do recebedor',
        \`recipient_name\` varchar(255) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Nome do recebedor',
        \`recipient_account_branch\` varchar(10) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Agência do recebedor',
        \`recipient_account_number\` varchar(20) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Conta do recebedor',
        \`recipient_account_type\` varchar(20) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Tipo da conta do recebedor',
        \`recipient_bank_ispb\` varchar(20) COLLATE utf8mb4_unicode_ci NULL COMMENT 'ISPB do banco do recebedor',
        \`recipient_bank_compe\` varchar(10) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Código COMPE do banco do recebedor',
        \`recipient_bank_name\` varchar(255) COLLATE utf8mb4_unicode_ci NULL COMMENT 'Nome do banco do recebedor',
        \`provider_slug\` enum ('hiperbanco') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identificador do provedor financeiro',
        \`client_id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID do cliente',
        \`account_id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID da conta pagadora',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        INDEX \`IDX_pix_transfer_provider\` (\`provider_slug\`),
        INDEX \`IDX_pix_transfer_transaction\` (\`transaction_id\`),
        INDEX \`IDX_pix_transfer_e2eid\` (\`end_to_end_id\`),
        INDEX \`IDX_pix_transfer_status\` (\`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // Foreign Keys
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` ADD CONSTRAINT \`FK_pix_transfer_client\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` ADD CONSTRAINT \`FK_pix_transfer_account\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` DROP FOREIGN KEY \`FK_pix_transfer_account\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pix_transfer\` DROP FOREIGN KEY \`FK_pix_transfer_client\``,
    );
    await queryRunner.query(`DROP TABLE \`pix_transfer\``);
  }
}
