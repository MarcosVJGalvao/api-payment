import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCancelReasonToBoleto1768200400000 implements MigrationInterface {
  name = 'AddCancelReasonToBoleto1768200400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'boleto',
      new TableColumn({
        name: 'cancel_reason',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Motivo: CancelledByRecipient, CancelledByDeadLine',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('boleto', 'cancel_reason');
  }
}
