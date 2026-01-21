import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiDeleteBackofficeUser() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Deletar usuário Backoffice' }),
    ApiParam({ name: 'id', description: 'ID do usuário' }),
    ApiResponse({
      status: 204,
      description: 'Usuário removido com sucesso',
    }),
    ApiResponse({
      status: 401,
      description: 'Erro de autenticação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            UNAUTHORIZED: {
              summary: 'Token inválido ou expirado',
              value: {
                errorCode: 'UNAUTHORIZED',
                message: 'Token de autenticação inválido ou expirado',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            USER_NOT_FOUND: {
              summary: 'Usuário não encontrado',
              value: {
                errorCode: 'USER_NOT_FOUND',
                message: 'User not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
