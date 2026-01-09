import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentsAndOurnumberColumnsToBoleto20260109033010 implements MigrationInterface {
    name = 'AddPaymentsAndOurnumberColumnsToBoleto20260109033010';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`boleto\`
            ADD COLUMN \`our_number\` varchar(50) NULL COMMENT 'Número do nosso número do boleto'
        `);

        await queryRunner.query(`
            ALTER TABLE \`boleto\`
            ADD COLUMN \`payments\` json NULL COMMENT 'Array de pagamentos do boleto recebido do Hiperbanco (pode ser null por muito tempo)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`boleto\`
            DROP COLUMN \`payments\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`boleto\`
            DROP COLUMN \`our_number\`
        `);
    }
}
