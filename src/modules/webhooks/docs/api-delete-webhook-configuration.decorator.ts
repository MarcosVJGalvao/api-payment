import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiDeleteWebhookConfiguration() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Remover configuração de webhook',
      description:
        'Realiza soft delete da configuração de webhook. ' +
        'Mensagens pendentes em fila não são afetadas — apenas novos eventos deixarão de ser despachados para esta URL.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID da configuração de webhook',
      example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    }),
    ApiResponse({
      status: 204,
      description: 'Configuração removida com sucesso',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
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
      status: 403,
      description: 'Permissão insuficiente',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            ACCESS_DENIED: {
              value: {
                errorCode: 'ACCESS_DENIED',
                message: 'Access denied',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Configuração não encontrada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            WEBHOOK_CONFIGURATION_NOT_FOUND: {
              value: {
                errorCode: 'WEBHOOK_CONFIGURATION_NOT_FOUND',
                message: 'Webhook configuration not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            UNEXPECTED_ERROR: {
              value: {
                errorCode: 'UNEXPECTED_ERROR',
                message: 'Internal server error',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
