import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBackofficeUser1768097374125 implements MigrationInterface {
  name = 'CreateBackofficeUser1768097374125';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`backoffice_users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`status\` enum ('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE', \`secretQuestion\` varchar(255) NULL, \`secretAnswer\` varchar(255) NULL, \`client_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_BACKOFFICE_USER_EMAIL_CLIENT\` (\`email\`, \`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    try {
      await queryRunner.query(
        `ALTER TABLE \`backoffice_users\` ADD CONSTRAINT \`FK_7d59ff018e629a9ffc5aa40d34a\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    } catch (e) {
      // Ignore if constraint already exists or handled by IF NOT EXISTS table creation implicitly affecting state
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`backoffice_users\` DROP FOREIGN KEY \`FK_7d59ff018e629a9ffc5aa40d34a\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6345143c04620f30df16b692a9\` ON \`backoffice_users\``,
    );
    await queryRunner.query(`DROP TABLE \`backoffice_users\``);
  }
}
