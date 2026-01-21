import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class ForceTedTableRelations1768910000000 implements MigrationInterface {
  name = 'ForceTedTableRelations1768910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('=== Starting Migration: ForceTedTableRelations ===');

    const tedTables = ['ted_transfer', 'ted_cash_in', 'ted_refund'];

    // 1. Harmonize Collations
    console.log(
      'Step 1: Harmonizing collations for account_id and client_id...',
    );
    for (const table of tedTables) {
      await queryRunner.query(
        'ALTER TABLE `' +
          table +
          '` ' +
          'MODIFY `account_id` VARCHAR(36) COLLATE utf8mb4_unicode_ci, ' +
          'MODIFY `client_id` VARCHAR(36) COLLATE utf8mb4_unicode_ci',
      );
    }

    // 2. Clean orphaned data
    console.log('Step 2: Cleaning orphaned data...');
    for (const table of tedTables) {
      // Clean account_id
      await queryRunner.query(
        'UPDATE `' +
          table +
          '` SET `account_id` = NULL ' +
          'WHERE `account_id` IS NOT NULL ' +
          'AND `account_id` NOT IN (SELECT `id` FROM `account`)',
      );

      // For client_id, it is non-nullable.
      const orphans = await queryRunner.query(
        'SELECT COUNT(*) as count FROM `' +
          table +
          '` ' +
          'WHERE `client_id` NOT IN (SELECT `id` FROM `client`)',
      );

      if (orphans[0].count > 0) {
        console.warn(
          'Found ' +
            orphans[0].count +
            ' orphaned client references in ' +
            table +
            '. Deleting them to allow FK creation.',
        );
        await queryRunner.query(
          'DELETE FROM `' +
            table +
            '` ' +
            'WHERE `client_id` NOT IN (SELECT `id` FROM `client`)',
        );
      }
    }

    // 3. Create Foreign Keys
    console.log('Step 3: Creating Foreign Keys...');
    for (const table of tedTables) {
      // Client FK
      await queryRunner.createForeignKey(
        table,
        new TableForeignKey({
          name: 'FK_' + table + '_client',
          columnNames: ['client_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'client',
          onDelete: 'CASCADE',
        }),
      );

      // Account FK
      await queryRunner.createForeignKey(
        table,
        new TableForeignKey({
          name: 'FK_' + table + '_account',
          columnNames: ['account_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'account',
          onDelete: 'SET NULL',
        }),
      );
    }

    console.log(
      '=== Migration ForceTedTableRelations completed successfully ===',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tedTables = ['ted_transfer', 'ted_cash_in', 'ted_refund'];

    for (const table of tedTables) {
      await queryRunner.dropForeignKey(table, 'FK_' + table + '_account');
      await queryRunner.dropForeignKey(table, 'FK_' + table + '_client');
    }
  }
}
