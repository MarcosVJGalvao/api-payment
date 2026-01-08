import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddClientIdToBoleto1767905339318 implements MigrationInterface {
    name = 'AddClientIdToBoleto1767905339318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar colunas como nullable primeiro (para permitir dados existentes)
        await queryRunner.addColumn('boleto', new TableColumn({
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do cliente',
        }));

        await queryRunner.addColumn('boleto', new TableColumn({
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID da conta que emitiu o boleto',
        }));

        await queryRunner.createIndex('boleto', new TableIndex({
            name: 'IDX_boleto_client',
            columnNames: ['client_id'],
        }));

        await queryRunner.createIndex('boleto', new TableIndex({
            name: 'IDX_boleto_account',
            columnNames: ['account_id'],
        }));

        await queryRunner.createIndex('boleto', new TableIndex({
            name: 'IDX_boleto_client_account',
            columnNames: ['client_id', 'account_id'],
        }));

        await queryRunner.createForeignKey('boleto', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_boleto_client',
        }));

        await queryRunner.createForeignKey('boleto', new TableForeignKey({
            columnNames: ['account_id'],
            referencedTableName: 'account',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_boleto_account',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('boleto', 'FK_boleto_account');
        await queryRunner.dropForeignKey('boleto', 'FK_boleto_client');
        await queryRunner.dropIndex('boleto', 'IDX_boleto_client_account');
        await queryRunner.dropIndex('boleto', 'IDX_boleto_account');
        await queryRunner.dropIndex('boleto', 'IDX_boleto_client');
        await queryRunner.dropColumn('boleto', 'account_id');
        await queryRunner.dropColumn('boleto', 'client_id');
    }
}
