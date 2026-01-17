import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class EnforcePixQrCodeRelation1768407000000 implements MigrationInterface {
  name = 'EnforcePixQrCodeRelation1768407000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('transaction');
    const hasForeignKey = table?.foreignKeys.find(
      (fk) => fk.name === 'FK_transaction_pix_qr_code',
    );
    const hasIndex = table?.indices.find(
      (idx) => idx.name === 'IDX_transaction_pix_qr_code_id',
    );

    if (!hasIndex) {
      await queryRunner.createIndex(
        'transaction',
        new TableIndex({
          name: 'IDX_transaction_pix_qr_code_id',
          columnNames: ['pix_qr_code_id'],
        }),
      );
    }

    if (!hasForeignKey) {
      await queryRunner.createForeignKey(
        'transaction',
        new TableForeignKey({
          name: 'FK_transaction_pix_qr_code',
          columnNames: ['pix_qr_code_id'],
          referencedTableName: 'pix_qr_codes',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('transaction');
    const hasForeignKey = table?.foreignKeys.find(
      (fk) => fk.name === 'FK_transaction_pix_qr_code',
    );
    const hasIndex = table?.indices.find(
      (idx) => idx.name === 'IDX_transaction_pix_qr_code_id',
    );

    if (hasForeignKey) {
      await queryRunner.dropForeignKey(
        'transaction',
        'FK_transaction_pix_qr_code',
      );
    }

    if (hasIndex) {
      await queryRunner.dropIndex(
        'transaction',
        'IDX_transaction_pix_qr_code_id',
      );
    }
  }
}
