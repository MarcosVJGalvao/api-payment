import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar REPROVED ao enum status da tabela transaction.
 */
export class AddReprovedStatusToTransaction1768201200000 implements MigrationInterface {
  name = 'AddReprovedStatusToTransaction1768201200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // MySQL: Alterar enum para incluir REPROVED
    await queryRunner.query(`
      ALTER TABLE \`transaction\` 
      MODIFY COLUMN \`status\` enum(
        'PENDING', 
        'IN_PROCESS', 
        'DONE', 
        'UNDONE', 
        'CANCELED', 
        'FAILED', 
        'REFUND_PENDING', 
        'REFUNDED',
        'REPROVED'
      ) NOT NULL DEFAULT 'PENDING'
    `);

    console.log('Added REPROVED to transaction.status enum');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: remover REPROVED do enum
    // Primeiro, atualizar registros com REPROVED para FAILED
    await queryRunner.query(`
      UPDATE \`transaction\` SET \`status\` = 'FAILED' WHERE \`status\` = 'REPROVED'
    `);

    await queryRunner.query(`
      ALTER TABLE \`transaction\` 
      MODIFY COLUMN \`status\` enum(
        'PENDING', 
        'IN_PROCESS', 
        'DONE', 
        'UNDONE', 
        'CANCELED', 
        'FAILED', 
        'REFUND_PENDING', 
        'REFUNDED'
      ) NOT NULL DEFAULT 'PENDING'
    `);
  }
}
