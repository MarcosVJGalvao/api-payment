import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RefactorBackofficeUser1768102800000 implements MigrationInterface {
  name = 'RefactorBackofficeUser1768102800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop secretQuestion column handling if it exists
    const table = await queryRunner.getTable('backoffice_users');
    const secretQuestionColumn = table?.findColumnByName('secretQuestion');
    const secretAnswerColumn = table?.findColumnByName('secretAnswer');

    if (secretQuestionColumn) {
      await queryRunner.dropColumn('backoffice_users', 'secretQuestion');
    }

    if (secretAnswerColumn) {
      await queryRunner.changeColumn(
        'backoffice_users',
        'secretAnswer',
        new TableColumn({
          name: 'secret_answer',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(
      'backoffice_users',
      'secret_answer',
      'secretAnswer',
    );
    await queryRunner.query(
      `ALTER TABLE \`backoffice_users\` ADD \`secretQuestion\` varchar(255) NULL`,
    );
  }
}
