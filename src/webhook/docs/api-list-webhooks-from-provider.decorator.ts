import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiListWebhooksFromProvider() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Listar webhooks do provedor',
      description:
        'Lista webhooks diretamente do provedor financeiro. Exclusivo para usuários internos.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de webhooks do provedor',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                context: { type: 'string' },
                eventName: { type: 'string' },
                uri: { type: 'string' },
                publicKey: { type: 'string' },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
            },
          },
        },
      },
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
      status: 403,
      description: 'Acesso negado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            ACCESS_DENIED: {
              summary: 'Apenas usuários internos',
              value: {
                errorCode: 'ACCESS_DENIED',
                message: 'Access denied - internal users only',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
