import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { Permission } from '../entities/permission.entity';

export function ApiCreatePermission() {
  return applyDecorators(
    ApiOperation({ summary: 'Criar uma nova permissão' }),
    ApiBody({ type: CreatePermissionDto }),
    ApiResponse({
      status: 201,
      description: 'Permissão criada com sucesso',
      type: Permission,
    }),
    ApiResponse({
      status: 400,
      description: 'Erro de validação',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'INVALID_INPUT',
          },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'name should not be empty',
              'name must be a string',
              'module should not be empty',
            ],
          },
          correlationId: {
            type: 'string',
            example: 'c113416d-2180-4141-9965-c14f93046977',
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
    ApiResponse({
      status: 409,
      description: 'Permissão já existe',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'PERMISSION_ALREADY_EXISTS',
          },
          message: {
            type: 'string',
            example: 'Permission already exists.',
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
