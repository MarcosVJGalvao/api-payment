import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBaseFinancialOperationColumns1768402000000 implements MigrationInterface {
  name = 'AddBaseFinancialOperationColumns1768402000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'pix_transfer',
      'pix_cash_in',
      'pix_refund',
      'boleto',
      'bill_payment',
    ];

    for (const tableName of tables) {
      // Add provider_slug if missing (some tables have 'provider' column instead)
      const hasProviderSlug = await queryRunner.hasColumn(
        tableName,
        'provider_slug',
      );
      if (!hasProviderSlug) {
        // Check if table has 'provider' column to rename
        const hasProvider = await queryRunner.hasColumn(tableName, 'provider');
        if (hasProvider) {
          await queryRunner.renameColumn(
            tableName,
            'provider',
            'provider_slug',
          );
        } else {
          await queryRunner.addColumn(
            tableName,
            new TableColumn({
              name: 'provider_slug',
              type: 'varchar',
              length: '50',
              isNullable: true,
              comment: 'Identificador do provedor financeiro',
            }),
          );
        }
      }

      // Ensure client_id column exists
      const hasClientId = await queryRunner.hasColumn(tableName, 'client_id');
      if (!hasClientId) {
        await queryRunner.addColumn(
          tableName,
          new TableColumn({
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do cliente',
          }),
        );
      }

      // Ensure account_id column exists
      const hasAccountId = await queryRunner.hasColumn(tableName, 'account_id');
      if (!hasAccountId) {
        await queryRunner.addColumn(
          tableName,
          new TableColumn({
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID da conta associada',
          }),
        );
      }

      // Ensure description column exists
      const hasDescription = await queryRunner.hasColumn(
        tableName,
        'description',
      );
      if (!hasDescription) {
        await queryRunner.addColumn(
          tableName,
          new TableColumn({
            name: 'description',
            type: 'varchar',
            length: '140',
            isNullable: true,
            comment: 'Descrição da operação',
          }),
        );
      }

      // Ensure deleted_at column exists (for soft delete)
      const hasDeletedAt = await queryRunner.hasColumn(tableName, 'deleted_at');
      if (!hasDeletedAt) {
        await queryRunner.addColumn(
          tableName,
          new TableColumn({
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: 'Data de exclusão lógica',
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
      const hasDeletedAt = await queryRunner.hasColumn(tableName, 'deleted_at');
      if (hasDeletedAt) {
        await queryRunner.dropColumn(tableName, 'deleted_at');
      }
    }
  }
}
