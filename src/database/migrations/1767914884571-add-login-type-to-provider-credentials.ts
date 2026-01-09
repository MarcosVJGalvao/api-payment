import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddLoginTypeToProviderCredentials1767914884571 implements MigrationInterface {
    name = 'AddLoginTypeToProviderCredentials1767914884571'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna login_type
        await queryRunner.addColumn('provider_credentials', new TableColumn({
            name: 'login_type',
            type: 'enum',
            enum: ['backoffice', 'bank'],
            default: "'backoffice'",
            comment: 'Tipo de login: backoffice ou bank',
        }));

        // Remover índice antigo e criar novo índice composto
        try {
            await queryRunner.dropIndex('provider_credentials', 'IDX_provider_credentials_slug');
        } catch (error) {
            // Índice pode não existir com esse nome exato
        }

        // Criar índice composto para provider_slug + login_type
        await queryRunner.createIndex('provider_credentials', new TableIndex({
            name: 'IDX_provider_credentials_provider_login_type',
            columnNames: ['provider_slug', 'login_type'],
            isUnique: false,
        }));

        // Criar índice apenas para provider_slug (mantendo para queries simples)
        await queryRunner.createIndex('provider_credentials', new TableIndex({
            name: 'IDX_provider_credentials_provider_slug',
            columnNames: ['provider_slug'],
            isUnique: false,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índices
        await queryRunner.dropIndex('provider_credentials', 'IDX_provider_credentials_provider_slug');
        await queryRunner.dropIndex('provider_credentials', 'IDX_provider_credentials_provider_login_type');

        // Recriar índice original
        await queryRunner.createIndex('provider_credentials', new TableIndex({
            name: 'IDX_provider_credentials_provider_slug',
            columnNames: ['provider_slug'],
            isUnique: false,
        }));

        // Remover coluna login_type
        await queryRunner.dropColumn('provider_credentials', 'login_type');
    }
}
