import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiRemoveRoleFromUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Remover role de um usuário' }),
    ApiParam({
      name: 'id',
      description: 'ID da role',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'userId',
      description: 'ID do usuário',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 204,
      description: 'Role removida com sucesso',
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
