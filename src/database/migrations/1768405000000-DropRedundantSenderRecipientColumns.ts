import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropRedundantSenderRecipientColumns1768405000000
  implements MigrationInterface
{
  name = 'DropRedundantSenderRecipientColumns1768405000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Columns to drop from pix_cash_in
    const pixCashInColumns = [
      'sender_type',
      'sender_bank_name',
      'recipient_type',
      'recipient_status',
      'recipient_account_status',
    ];

    for (const col of pixCashInColumns) {
      const hasColumn = await queryRunner.hasColumn('pix_cash_in', col);
      if (hasColumn) {
        await queryRunner.dropColumn('pix_cash_in', col);
      }
    }

    // Columns to drop from pix_refund
    const pixRefundColumns = ['sender_type', 'recipient_type'];

    for (const col of pixRefundColumns) {
      const hasColumn = await queryRunner.hasColumn('pix_refund', col);
      if (hasColumn) {
        await queryRunner.dropColumn('pix_refund', col);
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Down migration skipped - columns are no longer needed
  }
}
