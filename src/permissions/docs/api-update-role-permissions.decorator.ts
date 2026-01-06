import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdateRolePermissionsDto } from '../dto/update-role-permissions.dto';
import { Role } from '../entities/role.entity';

export function ApiUpdateRolePermissions() {
  return applyDecorators(
    ApiOperation({ summary: 'Atualizar permissões de uma role' }),
    ApiParam({
      name: 'id',
      description: 'ID da role',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: UpdateRolePermissionsDto,
      description:
        'Permissões a serem atualizadas (permissionNames ou permissionIds)',
    }),
    ApiResponse({
      status: 200,
      description: 'Permissões atualizadas com sucesso',
      type: Role,
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
            example: ['permissionIds must be an array'],
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
