import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegisteredStatusToBoleto20260109033922 implements MigrationInterface {
    name = 'AddRegisteredStatusToBoleto20260109033922';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar 'Registered' ao enum da coluna status na tabela boleto
        await queryRunner.query(`
            ALTER TABLE \`boleto\`
            MODIFY COLUMN \`status\` enum('Failure', 'Processing', 'Pending', 'Approved', 'Paid', 'Expired', 'Cancelled', 'Overdue', 'Registered') NOT NULL DEFAULT 'Pending' COMMENT 'Status atual do boleto'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover 'Registered' do enum (cuidado: pode causar erro se houver boletos com status Registered)
        await queryRunner.query(`
            ALTER TABLE \`boleto\`
            MODIFY COLUMN \`status\` enum('Failure', 'Processing', 'Pending', 'Approved', 'Paid', 'Expired', 'Cancelled', 'Overdue') NOT NULL DEFAULT 'Pending' COMMENT 'Status atual do boleto'
        `);
    }
}
