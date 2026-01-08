import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateClientRole1767905339321 implements MigrationInterface {
    name = 'CreateClientRole1767905339321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'client_role',
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
                        name: 'role_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                        comment: 'ID da role',
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

        await queryRunner.createIndex('client_role', new TableIndex({
            name: 'IDX_client_role_unique',
            columnNames: ['client_id', 'role_id'],
            isUnique: true,
        }));

        await queryRunner.createIndex('client_role', new TableIndex({
            name: 'IDX_client_role_client',
            columnNames: ['client_id'],
        }));

        await queryRunner.createIndex('client_role', new TableIndex({
            name: 'IDX_client_role_role',
            columnNames: ['role_id'],
        }));

        await queryRunner.createForeignKey('client_role', new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'client',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_client_role_client',
        }));

        await queryRunner.createForeignKey('client_role', new TableForeignKey({
            columnNames: ['role_id'],
            referencedTableName: 'role',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_client_role_role',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('client_role', 'FK_client_role_role');
        await queryRunner.dropForeignKey('client_role', 'FK_client_role_client');
        await queryRunner.dropIndex('client_role', 'IDX_client_role_role');
        await queryRunner.dropIndex('client_role', 'IDX_client_role_client');
        await queryRunner.dropIndex('client_role', 'IDX_client_role_unique');
        await queryRunner.dropTable('client_role');
    }
}
