import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddClientIdToWebhook1767905339319 implements MigrationInterface {
    name = 'AddClientIdToWebhook1767905339319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna como nullable primeiro (para permitir dados existentes)
        await queryRunner.addColumn('webhook', new TableColumn({
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do cliente',
        }));

        await queryRunner.createIndex('webhook', new TableIndex({
            name: 'IDX_webhook_client',
            columnNames: ['client_id'],
        }));

        await queryRunner.createForeignKey('webhook', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_webhook_client',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('webhook', 'FK_webhook_client');
        await queryRunner.dropIndex('webhook', 'IDX_webhook_client');
        await queryRunner.dropColumn('webhook', 'client_id');
    }
}
