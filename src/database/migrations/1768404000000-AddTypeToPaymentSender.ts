import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeToPaymentSender1768404000000 implements MigrationInterface {
  name = 'AddTypeToPaymentSender1768404000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('payment_sender', 'type');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'payment_sender',
        new TableColumn({
          name: 'type',
          type: 'varchar',
          length: '20',
          isNullable: true,
          comment: 'Tipo de remetente (Customer, Business)',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('payment_sender', 'type');
    if (hasColumn) {
      await queryRunner.dropColumn('payment_sender', 'type');
    }
  }
}
