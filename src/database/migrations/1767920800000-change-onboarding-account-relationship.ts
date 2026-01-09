import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class ChangeOnboardingAccountRelationship1767920800000 implements MigrationInterface {
    name = 'ChangeOnboardingAccountRelationship1767920800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Remover foreign key antiga de onboarding.account_id PRIMEIRO (se existir)
        const onboardingTable = await queryRunner.getTable('onboarding');
        const oldForeignKey = onboardingTable?.foreignKeys.find(
            fk => fk.name === 'FK_onboarding_account'
        );

        if (oldForeignKey) {
            await queryRunner.dropForeignKey('onboarding', 'FK_onboarding_account');
        }

        // 2. Remover índice antigo de account_id em onboarding (se existir)
        const onboardingIndexes = await queryRunner.query(`
            SHOW INDEX FROM \`onboarding\` WHERE Key_name = 'IDX_onboarding_account'
        `);
        
        if (onboardingIndexes && onboardingIndexes.length > 0) {
            await queryRunner.dropIndex('onboarding', 'IDX_onboarding_account');
        }

        // 3. Verificar se a coluna onboarding_id já existe na tabela account antes de adicionar
        const accountTable = await queryRunner.getTable('account');
        const onboardingIdColumn = accountTable?.findColumnByName('onboarding_id');

        if (!onboardingIdColumn) {
            // Adicionar coluna onboarding_id na tabela account (nullable inicialmente)
            await queryRunner.addColumn('account', new TableColumn({
                name: 'onboarding_id',
                type: 'varchar',
                length: '36',
                isNullable: true,
                comment: 'ID do onboarding',
            }));
        }

        // 4. Verificar se o índice já existe antes de criar
        const accountIndexes = await queryRunner.query(`
            SHOW INDEX FROM \`account\` WHERE Key_name = 'IDX_account_onboarding'
        `);

        if (!accountIndexes || accountIndexes.length === 0) {
            // Adicionar índice na coluna onboarding_id
            await queryRunner.createIndex('account', new TableIndex({
                name: 'IDX_account_onboarding',
                columnNames: ['onboarding_id'],
            }));
        }

        // 5. Dropar qualquer foreign key existente na coluna onboarding_id (se houver)
        const accountTableForFK = await queryRunner.getTable('account');
        const existingFKsOnColumn = accountTableForFK?.foreignKeys.filter(
            fk => fk.columnNames.includes('onboarding_id') && fk.name
        );
        
        if (existingFKsOnColumn && existingFKsOnColumn.length > 0) {
            for (const fk of existingFKsOnColumn) {
                if (fk.name) {
                    await queryRunner.dropForeignKey('account', fk.name);
                }
            }
        }

        // 6. Criar foreign key de account.onboarding_id para onboarding.id usando SQL direto (garante que apareça corretamente no cliente)
        await queryRunner.query(`
            ALTER TABLE \`account\`
            ADD CONSTRAINT \`FK_account_onboarding\`
            FOREIGN KEY (\`onboarding_id\`)
            REFERENCES \`onboarding\`(\`id\`)
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        // 7. Remover coluna account_id de onboarding (após criar a nova relação)
        const onboardingColumns = await queryRunner.query(`
            SHOW COLUMNS FROM \`onboarding\` LIKE 'account_id'
        `);
        
        if (onboardingColumns && onboardingColumns.length > 0) {
            await queryRunner.dropColumn('onboarding', 'account_id');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Adicionar coluna account_id de volta em onboarding
        await queryRunner.addColumn('onboarding', new TableColumn({
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID da conta',
        }));

        // 2. Adicionar índice em account_id
        await queryRunner.createIndex('onboarding', new TableIndex({
            name: 'IDX_onboarding_account',
            columnNames: ['account_id'],
        }));

        // 3. Adicionar foreign key de onboarding.account_id para account.id usando SQL direto
        await queryRunner.query(`
            ALTER TABLE \`onboarding\`
            ADD CONSTRAINT \`FK_onboarding_account\`
            FOREIGN KEY (\`account_id\`)
            REFERENCES \`account\`(\`id\`)
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

        // 4. Remover foreign key de account.onboarding_id usando SQL direto
        await queryRunner.query(`
            ALTER TABLE \`account\`
            DROP FOREIGN KEY \`FK_account_onboarding\`
        `);

        // 5. Remover índice de onboarding_id em account
        await queryRunner.dropIndex('account', 'IDX_account_onboarding');

        // 6. Remover coluna onboarding_id de account
        await queryRunner.dropColumn('account', 'onboarding_id');
    }
}
