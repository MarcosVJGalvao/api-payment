import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Role } from '../entities/role.entity';

export function ApiGetRoleById() {
  return applyDecorators(
    ApiOperation({ summary: 'Obter uma role por ID' }),
    ApiParam({
      name: 'id',
      description: 'ID da role',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Role encontrada',
      type: Role,
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
      description: 'Role não encontrada',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'ROLE_NOT_FOUND',
          },
          message: {
            type: 'string',
            example: 'Role not found.',
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
