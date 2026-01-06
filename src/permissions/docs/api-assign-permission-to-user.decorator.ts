import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiAssignPermissionToUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Atribuir permissão diretamente a um usuário' }),
    ApiParam({
      name: 'userId',
      description: 'ID do usuário',
      type: String,
      example: '0886d835-bb67-4085-9e33-69e36c040933',
    }),
    ApiParam({
      name: 'permissionId',
      description: 'ID da permissão',
      type: String,
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: 204,
      description: 'Permissão atribuída com sucesso',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário ou permissão não encontrado',
      schema: {
        type: 'object',
        properties: {
          errorCode: {
            type: 'string',
            example: 'USER_NOT_FOUND',
          },
          message: {
            type: 'string',
            example: 'User not found.',
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
  );
}
