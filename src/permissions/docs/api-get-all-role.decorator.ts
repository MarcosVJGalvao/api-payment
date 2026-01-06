import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllRole() {
  return applyDecorators(
    ApiOperation({ summary: 'Listar todas as roles' }),
    ApiResponse({
      status: 200,
      description: 'Lista de roles retornada com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: '83acd890-27a1-435d-9c10-4cd68d4b1c0d',
                },
                name: {
                  type: 'string',
                  example: 'Administrator',
                },
                description: {
                  type: 'string',
                  nullable: true,
                  example: 'Administrator with all permissions',
                },
                permissions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        format: 'uuid',
                        example: '931c89cf-9b81-4638-84dd-fd360ac8c069',
                      },
                      name: {
                        type: 'string',
                        example: '*:*',
                      },
                      module: {
                        type: 'string',
                        example: '*',
                      },
                      action: {
                        type: 'string',
                        example: '*',
                      },
                      description: {
                        type: 'string',
                        nullable: true,
                        example:
                          'All permissions for all modules (Super Admin)',
                      },
                    },
                  },
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-11-08T17:05:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-11-08T17:05:00.000Z',
                },
              },
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
                example: 4,
              },
              totalPages: {
                type: 'number',
                example: 1,
              },
              hasNextPage: {
                type: 'boolean',
                example: false,
              },
              hasPreviousPage: {
                type: 'boolean',
                example: false,
              },
            },
          },
        },
      },
      example: {
        data: [
          {
            id: '83acd890-27a1-435d-9c10-4cd68d4b1c0d',
            name: 'Administrator',
            description: 'Administrator with all permissions',
            permissions: [
              {
                id: '931c89cf-9b81-4638-84dd-fd360ac8c069',
                name: '*:*',
                module: '*',
                action: '*',
                description: 'All permissions for all modules (Super Admin)',
              },
            ],
            createdAt: '2025-11-08T17:05:00.000Z',
            updatedAt: '2025-11-08T17:05:00.000Z',
          },
          {
            id: '8d6a6083-fc4d-4363-b7f2-93411cc016d6',
            name: 'Coordinator',
            description: 'Coordinator with read and write permissions',
            permissions: [
              {
                id: '3a7037c1-9a00-4661-9ec3-76aa2491f499',
                name: 'user:read',
                module: 'user',
                action: 'read',
                description: 'Read permission for user module',
              },
              {
                id: '7814eeb4-1c60-4d4b-9737-a46eab02f16c',
                name: 'user:write',
                module: 'user',
                action: 'write',
                description: 'Write permission for user module',
              },
            ],
            createdAt: '2025-11-08T17:05:00.000Z',
            updatedAt: '2025-11-08T17:05:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 4,
          totalPages: 1,
          hasNextPage: false,
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
