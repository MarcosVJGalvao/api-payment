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
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';

export function ApiGetWebhookMessage() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Buscar mensagem de webhook por ID',
      description:
        'Retorna o detalhe completo de uma mensagem de webhook, incluindo o payload enviado ao cliente, ' +
        'histórico de tentativas e último código de resposta HTTP.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID da mensagem de webhook',
      example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    }),
    ApiResponse({
      status: 200,
      description: 'Mensagem encontrada',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          configurationId: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          eventType: { type: 'string', enum: Object.values(ApiPaymentWebhookEventType) },
          providerEventName: { type: 'string', example: 'PIX_CASHOUT_WAS_COMPLETED' },
          providerSlug: { type: 'string', example: 'hiperbanco' },
          status: { type: 'string', enum: Object.values(OutboundWebhookMessageStatus) },
          attemptCount: { type: 'number', example: 3 },
          responseStatusCode: { type: 'number', nullable: true, example: 503 },
          lastError: { type: 'string', nullable: true, example: 'connect ECONNREFUSED 203.0.113.1:443' },
          lastAttemptedAt: { type: 'string', format: 'date-time', nullable: true },
          deliveredAt: { type: 'string', format: 'date-time', nullable: true, example: null },
          correlationId: { type: 'string', nullable: true },
          payload: {
            type: 'array',
            description: 'Payload enviado ao endpoint do cliente',
            items: {
              type: 'object',
              properties: {
                entityId: { type: 'string' },
                companyKey: { type: 'string' },
                name: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                correlationId: { type: 'string' },
                metadata: {
                  type: 'object',
                  properties: {
                    clientId: { type: 'string' },
                    provider: { type: 'string', example: 'HIPERBANCO' },
                    environment: { type: 'string', example: 'PRODUCTION' },
                  },
                },
                data: { type: 'object' },
              },
            },
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
      description: 'Mensagem não encontrada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            WEBHOOK_MESSAGE_NOT_FOUND: {
              value: {
                errorCode: 'WEBHOOK_MESSAGE_NOT_FOUND',
                message: 'Webhook message not found',
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
