import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInProcessStatusToTedTransfer1768700000000 implements MigrationInterface {
  name = 'AddInProcessStatusToTedTransfer1768700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar a coluna enum para incluir IN_PROCESS
    await queryRunner.query(`
      ALTER TABLE ted_transfer 
      MODIFY COLUMN status ENUM('CREATED', 'IN_PROCESS', 'APPROVED', 'REPROVED', 'DONE', 'UNDONE', 'CANCELED', 'FAILED') 
      NOT NULL DEFAULT 'CREATED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para o enum original (sem IN_PROCESS)
    // Primeiro, atualiza registros com IN_PROCESS para CREATED
    await queryRunner.query(`
      UPDATE ted_transfer SET status = 'CREATED' WHERE status = 'IN_PROCESS'
    `);

    await queryRunner.query(`
      ALTER TABLE ted_transfer 
      MODIFY COLUMN status ENUM('CREATED', 'APPROVED', 'DONE', 'CANCELED', 'REPROVED', 'UNDONE', 'FAILED') 
      NOT NULL DEFAULT 'CREATED'
    `);
  }
}
