import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAliasToClient1768097279104 implements MigrationInterface {
  name = 'AddAliasToClient1768097279104';

  public async up(): Promise<void> {
    // Column already exists in DB but migration synchronization was lost.
    // Skipping creation to avoid duplicate column error.
    // await queryRunner.query(`ALTER TABLE \`client\` ADD \`alias\` varchar(50) NULL COMMENT 'Alias do cliente para identificação em webhooks'`);
    // await queryRunner.query(`ALTER TABLE \`client\` ADD UNIQUE INDEX \`IDX_71065dd6aa4640d821bfced4e1\` (\`alias\`)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`client\` DROP INDEX \`IDX_71065dd6aa4640d821bfced4e1\``,
    );
    await queryRunner.query(`ALTER TABLE \`client\` DROP COLUMN \`alias\``);
  }
}
