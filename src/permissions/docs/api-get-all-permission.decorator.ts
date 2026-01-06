import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllPermission() {
  return applyDecorators(
    ApiOperation({ summary: 'Listar todas as permissões' }),
    ApiResponse({
      status: 200,
      description: 'Lista de permissões retornada com sucesso',
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
                  example: 'All permissions for all modules (Super Admin)',
                },
                roles: {
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
                example: 19,
              },
              totalPages: {
                type: 'number',
                example: 2,
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
      example: {
        data: [
          {
            id: '931c89cf-9b81-4638-84dd-fd360ac8c069',
            name: '*:*',
            module: '*',
            action: '*',
            description: 'All permissions for all modules (Super Admin)',
            roles: [
              {
                id: '83acd890-27a1-435d-9c10-4cd68d4b1c0d',
                name: 'Administrator',
                description: 'Administrator with all permissions',
              },
            ],
            createdAt: '2025-11-08T17:05:00.000Z',
            updatedAt: '2025-11-08T17:05:00.000Z',
          },
          {
            id: '37363757-1770-46ed-8672-e4fdb12cb151',
            name: 'employee:write',
            module: 'employee',
            action: 'write',
            description: 'Write permission for employee module',
            roles: [
              {
                id: '8d6a6083-fc4d-4363-b7f2-93411cc016d6',
                name: 'Coordinator',
                description: 'Coordinator with read and write permissions',
              },
              {
                id: 'd479c58b-8689-47dd-a2d0-ce4b3fb624a9',
                name: 'Director',
                description: 'Director with full access to modules',
              },
            ],
            createdAt: '2025-11-08T17:05:00.000Z',
            updatedAt: '2025-11-08T17:05:00.000Z',
          },
          {
            id: '70e4280e-00dc-48e1-81af-684307db1199',
            name: 'employee:delete',
            module: 'employee',
            action: 'delete',
            description: 'Delete permission for employee module',
            roles: [],
            createdAt: '2025-11-08T17:05:00.000Z',
            updatedAt: '2025-11-08T17:05:00.000Z',
          },
          {
            id: 'daf8ad82-e5a0-4bf5-841d-95376a56c8cb',
            name: 'employee:read',
            module: 'employee',
            action: 'read',
            description: 'Read permission for employee module',
            roles: [
              {
                id: '8d6a6083-fc4d-4363-b7f2-93411cc016d6',
                name: 'Coordinator',
                description: 'Coordinator with read and write permissions',
              },
              {
                id: '977ba657-c626-4497-92d4-520061b9d59c',
                name: 'Teacher',
                description: 'Teacher with limited permissions',
              },
              {
                id: 'd479c58b-8689-47dd-a2d0-ce4b3fb624a9',
                name: 'Director',
                description: 'Director with full access to modules',
              },
            ],
            createdAt: '2025-11-08T17:05:00.000Z',
            updatedAt: '2025-11-08T17:05:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 19,
          totalPages: 2,
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
