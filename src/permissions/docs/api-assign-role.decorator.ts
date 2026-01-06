import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { AssignRoleBodyDto } from '../dto/assign-role-body.dto';

export function ApiAssignRole() {
  return applyDecorators(
    ApiOperation({ summary: 'Atribuir role a um usuário' }),
    ApiParam({
      name: 'id',
      description: 'ID da role',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: AssignRoleBodyDto,
      description: 'Dados do usuário para atribuir a role',
    }),
    ApiResponse({
      status: 204,
      description: 'Role atribuída com sucesso',
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
            example: ['userId should not be empty', 'userId must be a UUID'],
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
      description: 'Role ou usuário não encontrado',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'ROLE_NOT_FOUND',
          },
          message: {
            type: 'string',
            example: 'Role or user not found.',
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
