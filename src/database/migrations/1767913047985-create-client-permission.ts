import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateClientPermission1767913047985 implements MigrationInterface {
    name = 'CreateClientPermission1767913047985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'client_permission',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'client_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                        comment: 'ID do cliente',
                    },
                    {
                        name: 'permission_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                        comment: 'ID da permissão (scope)',
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        length: '6',
                        default: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        length: '6',
                        default: 'CURRENT_TIMESTAMP(6)',
                        onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'deleted_at',
                        type: 'datetime',
                        length: '6',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex('client_permission', new TableIndex({
            name: 'IDX_client_permission_unique',
            columnNames: ['client_id', 'permission_id'],
            isUnique: true,
        }));

        await queryRunner.createIndex('client_permission', new TableIndex({
            name: 'IDX_client_permission_client',
            columnNames: ['client_id'],
        }));

        await queryRunner.createIndex('client_permission', new TableIndex({
            name: 'IDX_client_permission_permission',
            columnNames: ['permission_id'],
        }));

        await queryRunner.createForeignKey('client_permission', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_client_permission_client',
        }));

        await queryRunner.createForeignKey('client_permission', new TableForeignKey({
            columnNames: ['permission_id'],
            referencedTableName: 'permission',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_client_permission_permission',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('client_permission', 'FK_client_permission_permission');
        await queryRunner.dropForeignKey('client_permission', 'FK_client_permission_client');
        await queryRunner.dropIndex('client_permission', 'IDX_client_permission_permission');
        await queryRunner.dropIndex('client_permission', 'IDX_client_permission_client');
        await queryRunner.dropIndex('client_permission', 'IDX_client_permission_unique');
        await queryRunner.dropTable('client_permission');
    }
}
