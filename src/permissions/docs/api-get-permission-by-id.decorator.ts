import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Permission } from '../entities/permission.entity';

export function ApiGetPermissionById() {
  return applyDecorators(
    ApiOperation({ summary: 'Obter uma permissão por ID' }),
    ApiParam({
      name: 'id',
      description: 'ID da permissão',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Permissão encontrada',
      type: Permission,
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
