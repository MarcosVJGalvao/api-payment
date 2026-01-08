import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClient1767905339314 implements MigrationInterface {
    name = 'CreateClient1767905339314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`client\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL COMMENT 'Nome do cliente',
                \`document\` varchar(20) NOT NULL COMMENT 'CPF ou CNPJ do cliente',
                \`status\` enum('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status do cliente',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_client_document\` (\`document\`),
                INDEX \`IDX_client_status\` (\`status\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_client_status\` ON \`client\``);
        await queryRunner.query(`DROP INDEX \`IDX_client_document\` ON \`client\``);
        await queryRunner.query(`DROP TABLE \`client\``);
    }
}
