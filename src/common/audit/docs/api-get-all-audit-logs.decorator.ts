import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogListItemDto } from '../dto/audit-log-list-item.dto';

export function ApiGetAllAuditLogs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar todos os logs de auditoria',
      description:
        'Lista logs de auditoria com paginação, filtros, busca por texto e ordenação. Utiliza o BaseQueryService para realizar queries avançadas.\n\n**Busca por texto (`search`):** O parâmetro `search` busca texto em múltiplos campos simultaneamente usando busca parcial (LIKE). Campos pesquisados: `username`, `entityType`, `description`, `entityId`, `userId`, `correlationId`.\n\n**Filtros disponíveis:** `action` (enum AuditAction), `status` (enum AuditLogStatus: Success ou Failure).\n\n**Campos de ordenação:** `id`, `action`, `entityType`, `entityId`, `userId`, `username`, `correlationId`, `status`, `createdAt`.',
    }),
    ApiResponse({
      status: 200,
      description:
        'Lista de logs de auditoria retornada com sucesso (apenas campos essenciais para listagem). Use GET /audit/:id para obter todos os detalhes.',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AuditLogListItemDto',
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                example: 1,
              },
              limit: {
                type: 'number',
                example: 10,
              },
              total: {
                type: 'number',
                example: 100,
              },
              totalPages: {
                type: 'number',
                example: 10,
              },
              hasNextPage: {
                type: 'boolean',
                example: true,
              },
              hasPreviousPage: {
                type: 'boolean',
                example: false,
              },
            },
          },
        },
      },
      type: AuditLogListItemDto,
      isArray: true,
      example: {
        data: [
          {
            id: '0886d835-bb67-4085-9e33-69e36c040933',
            action: 'USER_CREATED',
            entityType: 'User',
            username: 'admin',
            correlationId: '206285ed-eb73-48da-a58f-012960bbc3e4',
            status: 'Success',
            description: 'Created a user',
            createdAt: '2025-11-08T01:37:33.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Permissão negada',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'PERMISSION_DENIED',
          },
          message: {
            type: 'string',
            example: 'Permission denied.',
          },
          correlationId: {
            type: 'string',
            example: '9afe65e8-a787-4bd5-8f71-db7074117352',
          },
        },
      },
    }),
  );
}
