import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWebhookEventLogTable1768351691000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'webhook_event_log',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'authentication_code',
            type: 'varchar',
            length: '100',
            comment: 'Código de autenticação da transação no provedor',
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '50',
            comment: 'Tipo da entidade relacionada',
          },
          {
            name: 'entity_id',
            type: 'char',
            length: '36',
            isNullable: true,
            comment: 'ID da entidade relacionada',
          },
          {
            name: 'event_name',
            type: 'varchar',
            length: '50',
            comment: 'Nome do evento de webhook recebido',
          },
          {
            name: 'was_processed',
            type: 'boolean',
            default: true,
            comment: 'Se o evento foi processado com sucesso',
          },
          {
            name: 'skip_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Motivo se não foi processado',
          },
          {
            name: 'payload',
            type: 'json',
            isNullable: true,
            comment: 'Payload original do webhook',
          },
          {
            name: 'provider_timestamp',
            type: 'datetime',
            isNullable: true,
            comment: 'Timestamp do evento no provedor',
          },
          {
            name: 'client_id',
            type: 'char',
            length: '36',
            comment: 'ID do cliente proprietário',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação do registro',
          },
        ],
      }),
      true,
    );

    // Índice para busca por authentication_code
    await queryRunner.createIndex(
      'webhook_event_log',
      new TableIndex({
        name: 'IDX_webhook_event_log_authentication_code',
        columnNames: ['authentication_code'],
      }),
    );

    // Índice para busca por entidade
    await queryRunner.createIndex(
      'webhook_event_log',
      new TableIndex({
        name: 'IDX_webhook_event_log_entity',
        columnNames: ['entity_type', 'entity_id'],
      }),
    );

    // Índice para isolamento por cliente
    await queryRunner.createIndex(
      'webhook_event_log',
      new TableIndex({
        name: 'IDX_webhook_event_log_client_id',
        columnNames: ['client_id'],
      }),
    );

    // Índice para cleanup eficiente
    await queryRunner.createIndex(
      'webhook_event_log',
      new TableIndex({
        name: 'IDX_webhook_event_log_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'webhook_event_log',
      'IDX_webhook_event_log_created_at',
    );
    await queryRunner.dropIndex(
      'webhook_event_log',
      'IDX_webhook_event_log_client_id',
    );
    await queryRunner.dropIndex(
      'webhook_event_log',
      'IDX_webhook_event_log_entity',
    );
    await queryRunner.dropIndex(
      'webhook_event_log',
      'IDX_webhook_event_log_authentication_code',
    );
    await queryRunner.dropTable('webhook_event_log');
  }
}
