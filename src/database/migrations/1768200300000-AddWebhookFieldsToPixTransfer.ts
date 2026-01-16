import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWebhookFieldsToPixTransfer1768200300000 implements MigrationInterface {
  name = 'AddWebhookFieldsToPixTransfer1768200300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('pix_transfer', [
      new TableColumn({
        name: 'payment_date',
        type: 'datetime',
        isNullable: true,
        comment: 'Data do pagamento (webhook)',
      }),
      new TableColumn({
        name: 'is_refund',
        type: 'boolean',
        default: false,
        comment: 'Indica se é devolução (MED)',
      }),
      new TableColumn({
        name: 'end_to_end_id_original',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'EndToEndId original (se devolução)',
      }),
      new TableColumn({
        name: 'refusal_reason',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Motivo da recusa',
      }),
      new TableColumn({
        name: 'is_pix_open_banking',
        type: 'boolean',
        default: false,
        comment: 'Transação via Open Banking',
      }),
      new TableColumn({
        name: 'is_internal',
        type: 'boolean',
        default: false,
        comment: 'Transação interna',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pix_transfer', 'is_internal');
    await queryRunner.dropColumn('pix_transfer', 'is_pix_open_banking');
    await queryRunner.dropColumn('pix_transfer', 'refusal_reason');
    await queryRunner.dropColumn('pix_transfer', 'end_to_end_id_original');
    await queryRunner.dropColumn('pix_transfer', 'is_refund');
    await queryRunner.dropColumn('pix_transfer', 'payment_date');
  }
}
