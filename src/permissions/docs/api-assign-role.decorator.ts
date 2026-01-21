import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiAssignRole() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Atribuir role a um usuário' }),
    ApiParam({ name: 'userId', description: 'ID do usuário' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          roleId: { type: 'string', format: 'uuid' },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Role atribuída' }),
    ApiResponse({
      status: 401,
      description: 'Erro de autenticação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            UNAUTHORIZED: {
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
      description: 'Usuário ou Role não encontrada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            USER_NOT_FOUND: {
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
