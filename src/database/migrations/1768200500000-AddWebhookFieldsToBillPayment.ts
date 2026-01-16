import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWebhookFieldsToBillPayment1768200500000 implements MigrationInterface {
  name = 'AddWebhookFieldsToBillPayment1768200500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('bill_payment', [
      new TableColumn({
        name: 'confirmation_transaction_id',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'ID de confirmação da transação',
      }),
      new TableColumn({
        name: 'error_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Código de erro',
      }),
      new TableColumn({
        name: 'error_message',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Mensagem de erro',
      }),
      new TableColumn({
        name: 'cancel_reason',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Motivo do cancelamento',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bill_payment', 'cancel_reason');
    await queryRunner.dropColumn('bill_payment', 'error_message');
    await queryRunner.dropColumn('bill_payment', 'error_code');
    await queryRunner.dropColumn('bill_payment', 'confirmation_transaction_id');
  }
}
