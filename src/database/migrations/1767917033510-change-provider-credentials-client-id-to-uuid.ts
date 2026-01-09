import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeProviderCredentialsClientIdToUuid1767917033510 implements MigrationInterface {
    name = 'ChangeProviderCredentialsClientIdToUuid1767917033510';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Alterar tipo da coluna de varchar(255) para varchar(36) (UUID)
        // Usando ALTER TABLE diretamente para garantir compatibilidade
        await queryRunner.query(`
            ALTER TABLE \`provider_credentials\`
            MODIFY COLUMN \`client_id\` varchar(36) NULL COMMENT 'ID do cliente multi-tenant'
        `);

        // Verificar se a foreign key já existe antes de criar
        const table = await queryRunner.getTable('provider_credentials');
        const foreignKeyExists = table?.foreignKeys.find(
            fk => fk.name === 'FK_provider_credentials_client'
        );

        // Adicionar foreign key para a tabela client apenas se não existir
        if (!foreignKeyExists) {
            // Usar query SQL direta para garantir compatibilidade com MySQL
            await queryRunner.query(`
                ALTER TABLE \`provider_credentials\`
                ADD CONSTRAINT \`FK_provider_credentials_client\`
                FOREIGN KEY (\`client_id\`)
                REFERENCES \`client\`(\`id\`)
                ON DELETE SET NULL
                ON UPDATE CASCADE
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a foreign key existe antes de remover
        const table = await queryRunner.getTable('provider_credentials');
        const foreignKey = table?.foreignKeys.find(
            fk => fk.name === 'FK_provider_credentials_client'
        );

        // Remover foreign key apenas se existir
        if (foreignKey) {
            await queryRunner.query(`
                ALTER TABLE \`provider_credentials\`
                DROP FOREIGN KEY \`FK_provider_credentials_client\`
            `);
        }

        // Reverter tipo da coluna para varchar(255)
        await queryRunner.query(`
            ALTER TABLE \`provider_credentials\`
            MODIFY COLUMN \`client_id\` varchar(255) NULL COMMENT 'Client ID interno gerado pela aplicação'
        `);
    }
}
