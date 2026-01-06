import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateBulkPermissionsDto } from '../dto/create-bulk-permissions.dto';
import { Permission } from '../entities/permission.entity';

export function ApiCreateBulkPermissions() {
  return applyDecorators(
    ApiOperation({ summary: 'Criar múltiplas permissões para um módulo' }),
    ApiBody({
      type: CreateBulkPermissionsDto,
      examples: {
        example1: {
          value: {
            module: 'user',
            actions: ['read', 'write', 'delete', 'create'],
            description: 'Permissões para gerenciar usuários',
          },
        },
        example2: {
          value: {
            module: 'employee',
            actions: ['read', 'write'],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Permissões criadas com sucesso',
      type: [Permission],
      example: [
        {
          id: 'uuid-1',
          name: 'user:read',
          module: 'user',
          action: 'read',
          description: 'Permissões para gerenciar usuários',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T10:00:00Z',
        },
        {
          id: 'uuid-2',
          name: 'user:write',
          module: 'user',
          action: 'write',
          description: 'Permissões para gerenciar usuários',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T10:00:00Z',
        },
      ],
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
      schema: {
        type: 'object',
        properties: {
          errorCode: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          message: {
            type: 'string',
            example: 'Validation failed',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Permissão negada',
      schema: {
        type: 'object',
        properties: {
          errorCode: {
            type: 'string',
            example: 'PERMISSION_DENIED',
          },
          message: {
            type: 'string',
            example: 'Permission denied.',
          },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Todas as permissões já existem',
      schema: {
        type: 'object',
        properties: {
          errorCode: {
            type: 'string',
            example: 'PERMISSION_ALREADY_EXISTS',
          },
          message: {
            type: 'string',
            example: 'Todas as permissões já existem: user:read, user:write',
          },
        },
      },
    }),
  );
}
