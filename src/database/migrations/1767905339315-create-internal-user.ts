import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInternalUser1767905339315 implements MigrationInterface {
    name = 'CreateInternalUser1767905339315'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_internal_user_email\` ON \`internal_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_internal_user_username\` ON \`internal_user\``);
        await queryRunner.query(`DROP TABLE \`internal_user\``);
    }
}
