import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiCreateBulkPermissions() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Criar múltiplas permissões em lote' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          permissions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                module: { type: 'string' },
                action: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Permissões criadas' }),
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
  );
}
