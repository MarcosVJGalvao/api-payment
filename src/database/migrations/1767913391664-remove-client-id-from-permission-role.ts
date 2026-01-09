import { MigrationInterface, QueryRunner, TableIndex, TableForeignKey, TableColumn } from 'typeorm';

export class RemoveClientIdFromPermissionRole1767913391664 implements MigrationInterface {
    name = 'RemoveClientIdFromPermissionRole1767913391664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remover foreign keys primeiro
        const permissionTable = await queryRunner.getTable('permission');
        const permissionForeignKey = permissionTable?.foreignKeys.find(
            fk => fk.columnNames.includes('client_id')
        );
        if (permissionForeignKey) {
            await queryRunner.dropForeignKey('permission', permissionForeignKey);
        }

        const roleTable = await queryRunner.getTable('role');
        const roleForeignKey = roleTable?.foreignKeys.find(
            fk => fk.columnNames.includes('client_id')
        );
        if (roleForeignKey) {
            await queryRunner.dropForeignKey('role', roleForeignKey);
        }

        // Remover índices relacionados a client_id
        try {
            await queryRunner.dropIndex('permission', 'IDX_permission_client');
        } catch (error) {
            // Índice pode não existir
        }

        try {
            await queryRunner.dropIndex('permission', 'IDX_permission_name_client');
        } catch (error) {
            // Índice pode não existir
        }

        try {
            await queryRunner.dropIndex('role', 'IDX_role_client');
        } catch (error) {
            // Índice pode não existir
        }

        // Remover constraint única composta (name, clientId) e criar única simples (name)
        try {
            await queryRunner.query(`ALTER TABLE \`permission\` DROP INDEX \`IDX_permission_name_client\``);
        } catch (error) {
            // Pode não existir
        }

        try {
            await queryRunner.query(`ALTER TABLE \`role\` DROP INDEX \`IDX_role_name_client\``);
        } catch (error) {
            // Pode não existir
        }

        // Criar constraint única simples para name
        await queryRunner.createIndex('permission', new TableIndex({
            name: 'IDX_permission_name_unique',
            columnNames: ['name'],
            isUnique: true,
        }));

        await queryRunner.createIndex('role', new TableIndex({
            name: 'IDX_role_name_unique',
            columnNames: ['name'],
            isUnique: true,
        }));

        // Remover colunas client_id
        await queryRunner.dropColumn('permission', 'client_id');
        await queryRunner.dropColumn('role', 'client_id');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Adicionar colunas client_id de volta
        await queryRunner.addColumn('permission', new TableColumn({
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do cliente (null para permissões globais)',
        }));

        await queryRunner.addColumn('role', new TableColumn({
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do cliente (null para roles globais)',
        }));

        // Remover índices únicos simples
        await queryRunner.dropIndex('permission', 'IDX_permission_name_unique');
        await queryRunner.dropIndex('role', 'IDX_role_name_unique');

        // Criar índices únicos compostos
        await queryRunner.createIndex('permission', new TableIndex({
            name: 'IDX_permission_name_client',
            columnNames: ['name', 'client_id'],
            isUnique: true,
        }));

        await queryRunner.createIndex('permission', new TableIndex({
            name: 'IDX_permission_client',
            columnNames: ['client_id'],
        }));

        await queryRunner.createIndex('role', new TableIndex({
            name: 'IDX_role_name_client',
            columnNames: ['name', 'client_id'],
            isUnique: true,
        }));

        await queryRunner.createIndex('role', new TableIndex({
            name: 'IDX_role_client',
            columnNames: ['client_id'],
        }));

        // Recriar foreign keys
        await queryRunner.createForeignKey('permission', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            name: 'FK_permission_client',
        }));

        await queryRunner.createForeignKey('role', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            name: 'FK_role_client',
        }));
    }
}
