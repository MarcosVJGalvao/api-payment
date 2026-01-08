import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnboarding1767905339317 implements MigrationInterface {
    name = 'CreateOnboarding1767905339317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`onboarding\` (
                \`id\` varchar(36) NOT NULL,
                \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
                \`account_id\` varchar(36) NOT NULL COMMENT 'ID da conta',
                \`external_user_id\` varchar(255) NOT NULL COMMENT 'ID externo do usuário no provedor financeiro',
                \`register_name\` varchar(255) NOT NULL COMMENT 'Nome de registro',
                \`document_number\` varchar(20) NOT NULL COMMENT 'Número do documento',
                \`type_account\` enum('PF', 'PJ') NOT NULL COMMENT 'Tipo de conta (PF ou PJ)',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_onboarding_external_client\` (\`external_user_id\`, \`client_id\`),
                INDEX \`IDX_onboarding_client\` (\`client_id\`),
                INDEX \`IDX_onboarding_account\` (\`account_id\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_onboarding_client\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT \`FK_onboarding_account\` FOREIGN KEY (\`account_id\`) REFERENCES \`account\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`onboarding\` DROP FOREIGN KEY \`FK_onboarding_account\``);
        await queryRunner.query(`ALTER TABLE \`onboarding\` DROP FOREIGN KEY \`FK_onboarding_client\``);
        await queryRunner.query(`DROP INDEX \`IDX_onboarding_account\` ON \`onboarding\``);
        await queryRunner.query(`DROP INDEX \`IDX_onboarding_client\` ON \`onboarding\``);
        await queryRunner.query(`DROP INDEX \`IDX_onboarding_external_client\` ON \`onboarding\``);
        await queryRunner.query(`DROP TABLE \`onboarding\``);
    }
}
