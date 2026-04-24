import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

export function ApiGetWebhookConfiguration() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Buscar configuração de webhook por ID',
      description:
        'Retorna os detalhes de uma configuração de webhook outbound. ' +
        'A `privateKey` nunca é retornada — somente na criação.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID da configuração de webhook',
      example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    }),
    ApiResponse({
      status: 200,
      description: 'Configuração encontrada',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          eventType: { type: 'string', enum: Object.values(ApiPaymentWebhookEventType) },
          url: { type: 'string', example: 'https://cliente.com.br/webhooks/api-payment' },
          publicKey: { type: 'string', example: 'pub_abc123' },
          isActive: { type: 'boolean', example: true },
          circuitBreakerFailureCount: { type: 'number', example: 0 },
          circuitBreakerOpenUntil: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: null,
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
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
              summary: 'ID inexistente ou pertence a outro cliente',
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
