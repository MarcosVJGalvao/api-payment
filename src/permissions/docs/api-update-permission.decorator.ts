import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { Permission } from '../entities/permission.entity';

export function ApiUpdatePermission() {
  return applyDecorators(
    ApiOperation({ summary: 'Atualizar uma permissão' }),
    ApiParam({
      name: 'id',
      description: 'ID da permissão',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({ type: UpdatePermissionDto }),
    ApiResponse({
      status: 200,
      description: 'Permissão atualizada com sucesso',
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
            example: ['name must be a string'],
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
      status: 404,
      description: 'Permissão não encontrada',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'PERMISSION_NOT_FOUND',
          },
          message: {
            type: 'string',
            example: 'Permission not found.',
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
