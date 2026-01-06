import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Permission } from '../entities/permission.entity';

export function ApiGetUserDirectPermissions() {
  return applyDecorators(
    ApiOperation({ summary: 'Listar permissões diretas de um usuário' }),
    ApiParam({
      name: 'userId',
      description: 'ID do usuário',
      type: String,
      example: '0886d835-bb67-4085-9e33-69e36c040933',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de permissões diretas do usuário',
      type: [Permission],
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'user:delete',
          module: 'user',
          action: 'delete',
          description: 'Permite deletar usuários',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T10:00:00Z',
        },
      ],
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
