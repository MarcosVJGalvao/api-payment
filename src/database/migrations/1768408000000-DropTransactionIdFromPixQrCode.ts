import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropTransactionIdFromPixQrCode1768408000000 implements MigrationInterface {
  name = 'DropTransactionIdFromPixQrCode1768408000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pix_qr_codes');
    const column = table?.columns.find((c) => c.name === 'transaction_id');

    if (column) {
      await queryRunner.dropColumn('pix_qr_codes', 'transaction_id');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pix_qr_codes',
      new TableColumn({
        name: 'transaction_id',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'ID da transação quando pago',
      }),
    );
  }
}
