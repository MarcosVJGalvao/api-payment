import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateProviderCredentials1767660322397 implements MigrationInterface {
    name = 'CreateProviderCredentials1767660322397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'provider_credentials',
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
                        name: 'provider_slug',
                        type: 'varchar',
                        length: '50',
                        comment: 'Identificador do provedor (ex: hiperbanco)',
                    },
                    {
                        name: 'login',
                        type: 'varchar',
                        length: '255',
                        comment: 'Usuário/Email genérico para login',
                    },
                    {
                        name: 'password',
                        type: 'text',
                        comment: 'Senha criptografada',
                    },
                    {
                        name: 'client_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        comment: 'Client ID interno gerado pela aplicação',
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        precision: 6,
                        default: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        precision: 6,
                        default: 'CURRENT_TIMESTAMP(6)',
                        onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'deleted_at',
                        type: 'datetime',
                        precision: 6,
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'provider_credentials',
            new TableIndex({
                name: 'IDX_provider_credentials_slug',
                columnNames: ['provider_slug'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('provider_credentials', 'IDX_provider_credentials_slug');
        await queryRunner.dropTable('provider_credentials');
    }
}
