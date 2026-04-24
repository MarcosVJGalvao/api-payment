import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';

const messageSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    configurationId: { type: 'string', format: 'uuid' },
    clientId: { type: 'string', format: 'uuid' },
    eventType: { type: 'string', enum: Object.values(ApiPaymentWebhookEventType) },
    providerEventName: { type: 'string', example: 'PIX_CASHOUT_WAS_COMPLETED' },
    providerSlug: { type: 'string', example: 'hiperbanco' },
    status: { type: 'string', enum: Object.values(OutboundWebhookMessageStatus) },
    attemptCount: { type: 'number', example: 1 },
    responseStatusCode: { type: 'number', nullable: true, example: 200 },
    lastError: { type: 'string', nullable: true, example: null },
    lastAttemptedAt: { type: 'string', format: 'date-time', nullable: true },
    deliveredAt: { type: 'string', format: 'date-time', nullable: true },
    correlationId: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export function ApiListWebhookMessages() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Listar mensagens de webhook outbound',
      description:
        'Retorna mensagens de webhook paginadas com filtros opcionais. ' +
        'Cada mensagem representa uma tentativa de entrega de evento ao endpoint do cliente.',
    }),
    ApiQuery({ name: 'status', required: false, enum: OutboundWebhookMessageStatus, description: 'Filtrar por status' }),
    ApiQuery({ name: 'eventType', required: false, enum: ApiPaymentWebhookEventType, description: 'Filtrar por tipo de evento' }),
    ApiQuery({ name: 'configurationId', required: false, type: String, description: 'UUID da configuração' }),
    ApiQuery({ name: 'startDate', required: false, type: String, example: '2026-01-01T00:00:00.000Z', description: 'Data inicial (ISO 8601)' }),
    ApiQuery({ name: 'endDate', required: false, type: String, example: '2026-12-31T23:59:59.999Z', description: 'Data final (ISO 8601)' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' }),
    ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10, description: 'Itens por página (máx 100)' }),
    ApiResponse({
      status: 200,
      description: 'Lista paginada de mensagens',
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: messageSchema },
          total: { type: 'number', example: 42 },
          page: { type: 'number', example: 1 },
          pageSize: { type: 'number', example: 10 },
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
