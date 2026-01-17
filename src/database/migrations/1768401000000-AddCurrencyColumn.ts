import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCurrencyColumn1768401000000 implements MigrationInterface {
  name = 'AddCurrencyColumn1768401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'pix_transfer',
      'pix_cash_in',
      'pix_refund',
      'boleto',
      'bill_payment',
    ];

    for (const tableName of tables) {
      const hasColumn = await queryRunner.hasColumn(tableName, 'currency');
      if (!hasColumn) {
        await queryRunner.addColumn(
          tableName,
          new TableColumn({
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            comment: 'Código da moeda (ISO 4217)',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'pix_transfer',
      'pix_cash_in',
      'pix_refund',
      'boleto',
      'bill_payment',
    ];

    for (const tableName of tables) {
      const hasColumn = await queryRunner.hasColumn(tableName, 'currency');
      if (hasColumn) {
        await queryRunner.dropColumn(tableName, 'currency');
      }
    }
  }
}
