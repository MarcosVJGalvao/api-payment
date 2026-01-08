import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccount1767905339316 implements MigrationInterface {
    name = 'CreateAccount1767905339316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`account\` (
                \`id\` varchar(36) NOT NULL,
                \`external_id\` varchar(255) NOT NULL COMMENT 'ID externo da conta no provedor financeiro',
                \`client_id\` varchar(36) NOT NULL COMMENT 'ID do cliente',
                \`status\` enum('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status da conta',
                \`branch\` varchar(10) NOT NULL COMMENT 'Agência da conta',
                \`number\` varchar(20) NOT NULL COMMENT 'Número da conta',
                \`type\` enum('MAIN', 'SAVINGS') NOT NULL COMMENT 'Tipo da conta',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_account_external_client\` (\`external_id\`, \`client_id\`),
                INDEX \`IDX_account_client\` (\`client_id\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_account_client\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_account_client\``);
        await queryRunner.query(`DROP INDEX \`IDX_account_client\` ON \`account\``);
        await queryRunner.query(`DROP INDEX \`IDX_account_external_client\` ON \`account\``);
        await queryRunner.query(`DROP TABLE \`account\``);
    }
}
