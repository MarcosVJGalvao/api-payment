import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProviderTransactionIdToTedTransfer1768600000000 implements MigrationInterface {
  name = 'AddProviderTransactionIdToTedTransfer1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tedTransferTable = await queryRunner.getTable('ted_transfer');

    // Adicionar coluna provider_transaction_id
    if (
      tedTransferTable &&
      !tedTransferTable.columns.find(
        (c) => c.name === 'provider_transaction_id',
      )
    ) {
      await queryRunner.addColumn(
        'ted_transfer',
        new TableColumn({
          name: 'provider_transaction_id',
          type: 'varchar',
          length: '100',
          isNullable: true,
          comment: 'ID da transação no provedor',
        }),
      );
    }

    // Corrigir authentication_code para permitir NULL
    // (o registro é criado antes de chamar o provedor que retorna o authentication_code)
    const authCodeColumn = tedTransferTable?.columns.find(
      (c) => c.name === 'authentication_code',
    );
    if (authCodeColumn && !authCodeColumn.isNullable) {
      await queryRunner.changeColumn(
        'ted_transfer',
        'authentication_code',
        new TableColumn({
          name: 'authentication_code',
          type: 'varchar',
          length: '100',
          isNullable: true,
          comment: 'Código de autenticação retornado pelo provedor',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tedTransferTable = await queryRunner.getTable('ted_transfer');

    if (
      tedTransferTable?.columns.find(
        (c) => c.name === 'provider_transaction_id',
      )
    ) {
      await queryRunner.dropColumn('ted_transfer', 'provider_transaction_id');
    }

    // Reverter authentication_code para NOT NULL
    const authCodeColumn = tedTransferTable?.columns.find(
      (c) => c.name === 'authentication_code',
    );
    if (authCodeColumn && authCodeColumn.isNullable) {
      await queryRunner.changeColumn(
        'ted_transfer',
        'authentication_code',
        new TableColumn({
          name: 'authentication_code',
          type: 'varchar',
          length: '100',
          isNullable: false,
        }),
      );
    }
  }
}
