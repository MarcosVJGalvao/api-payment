import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddClientIdToPermissionRole1767905339320 implements MigrationInterface {
    name = 'AddClientIdToPermissionRole1767905339320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar client_id a permission
        await queryRunner.addColumn('permission', new TableColumn({
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do cliente (null para permissões globais)',
        }));

        // Adicionar client_id a role
        await queryRunner.addColumn('role', new TableColumn({
            name: 'client_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do cliente (null para roles globais)',
        }));

        // Remover índices únicos antigos - buscar por constraints únicas
        const permissionTable = await queryRunner.getTable('permission');
        const permissionUniqueConstraint = permissionTable?.uniques.find(unique => 
            unique.columnNames.length === 1 && unique.columnNames.includes('name')
        );
        if (permissionUniqueConstraint) {
            await queryRunner.query(`ALTER TABLE \`permission\` DROP INDEX \`${permissionUniqueConstraint.name}\``);
        }

        const roleTable = await queryRunner.getTable('role');
        const roleUniqueConstraint = roleTable?.uniques.find(unique => 
            unique.columnNames.length === 1 && unique.columnNames.includes('name')
        );
        if (roleUniqueConstraint) {
            await queryRunner.query(`ALTER TABLE \`role\` DROP INDEX \`${roleUniqueConstraint.name}\``);
        }

        // Criar novos índices únicos compostos
        await queryRunner.createIndex('permission', new TableIndex({
            name: 'IDX_permission_name_client',
            columnNames: ['name', 'client_id'],
            isUnique: true,
        }));

        await queryRunner.createIndex('role', new TableIndex({
            name: 'IDX_role_name_client',
            columnNames: ['name', 'client_id'],
            isUnique: true,
        }));

        // Criar índices para client_id
        await queryRunner.createIndex('permission', new TableIndex({
            name: 'IDX_permission_client',
            columnNames: ['client_id'],
        }));

        await queryRunner.createIndex('role', new TableIndex({
            name: 'IDX_role_client',
            columnNames: ['client_id'],
        }));

        // Criar foreign keys
        await queryRunner.createForeignKey('permission', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_permission_client',
        }));

        await queryRunner.createForeignKey('role', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_role_client',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('role', 'FK_role_client');
        await queryRunner.dropForeignKey('permission', 'FK_permission_client');
        await queryRunner.dropIndex('role', 'IDX_role_client');
        await queryRunner.dropIndex('permission', 'IDX_permission_client');
        await queryRunner.dropIndex('role', 'IDX_role_name_client');
        await queryRunner.dropIndex('permission', 'IDX_permission_name_client');
        
        // Recriar índices únicos antigos
        await queryRunner.createIndex('role', new TableIndex({
            name: 'IDX_ae4578dcaed5adff96595e6166',
            columnNames: ['name'],
            isUnique: true,
        }));

        await queryRunner.createIndex('permission', new TableIndex({
            name: 'IDX_240853a0c3353c25fb12434ad3',
            columnNames: ['name'],
            isUnique: true,
        }));

        await queryRunner.dropColumn('role', 'client_id');
        await queryRunner.dropColumn('permission', 'client_id');
    }
}
