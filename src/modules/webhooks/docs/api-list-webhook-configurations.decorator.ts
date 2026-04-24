import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

export function ApiListWebhookConfigurations() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Listar configurações de webhook',
      description:
        'Retorna todas as configurações de webhook outbound do cliente autenticado. ' +
        'A `privateKey` nunca é retornada nesta listagem.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de configurações',
      schema: {
        type: 'array',
        items: {
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
