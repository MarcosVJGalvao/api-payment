import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateWebhook1767702974000 implements MigrationInterface {
    name = 'CreateWebhook1767702974000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'webhook',
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
                        name: 'name',
                        type: 'varchar',
                        length: '50',
                        comment: 'Nome do webhook definido pelo usuário',
                    },
                    {
                        name: 'context',
                        type: 'enum',
                        enum: ['Boleto', 'Pix', 'Ted', 'Payment', 'Account', 'Authorization', 'Card', 'Customer', 'Business', 'Document', 'Dict', 'Slc', 'OpenFinance'],
                        comment: 'Contexto do evento (ex: Boleto, Pix)',
                    },
                    {
                        name: 'event_name',
                        type: 'varchar',
                        length: '255',
                        comment: 'Nome do evento assinado',
                    },
                    {
                        name: 'uri',
                        type: 'varchar',
                        length: '500',
                        comment: 'Endpoint de callback para receber eventos',
                    },
                    {
                        name: 'provider_slug',
                        type: 'varchar',
                        length: '50',
                        comment: 'Identificador do provedor financeiro',
                    },
                    {
                        name: 'external_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        comment: 'ID retornado pelo provedor ao registrar o webhook',
                    },
                    {
                        name: 'public_key',
                        type: 'text',
                        isNullable: true,
                        comment: 'Chave pública para validação de assinatura',
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                        comment: 'Status do webhook',
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
            'webhook',
            new TableIndex({
                name: 'IDX_webhook_provider_slug',
                columnNames: ['provider_slug'],
            }),
        );

        await queryRunner.createIndex(
            'webhook',
            new TableIndex({
                name: 'IDX_webhook_context',
                columnNames: ['context'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('webhook', 'IDX_webhook_context');
        await queryRunner.dropIndex('webhook', 'IDX_webhook_provider_slug');
        await queryRunner.dropTable('webhook');
    }
}
