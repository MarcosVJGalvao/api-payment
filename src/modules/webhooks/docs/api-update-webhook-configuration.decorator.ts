import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpdateWebhookConfigurationDto } from '../dto/update-webhook-configuration.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

export function ApiUpdateWebhookConfiguration() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto, UpdateWebhookConfigurationDto),
    ApiOperation({
      summary: 'Atualizar configuração de webhook',
      description:
        'Atualiza parcialmente uma configuração de webhook outbound. ' +
        'Se `publicKey` ou `privateKey` forem informados, o novo par de chaves é gerado/substituído. ' +
        'Quando as chaves forem atualizadas, a nova `privateKey` é retornada nesta resposta.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID da configuração de webhook',
      example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    }),
    ApiBody({
      type: UpdateWebhookConfigurationDto,
      examples: {
        'Alterar URL': {
          value: { url: 'https://cliente.com.br/webhooks/v2' },
        },
        'Trocar par de chaves HMAC': {
          value: {
            publicKey: 'nova-chave-publica',
            privateKey: 'novo-segredo-hmac',
          },
        },
        'Alterar tipo de evento': {
          value: { eventType: ApiPaymentWebhookEventType.BOLETO_CASH_IN_CLEARED },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Configuração atualizada. `privateKey` incluída somente se as chaves foram alteradas.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          eventType: { type: 'string', enum: Object.values(ApiPaymentWebhookEventType) },
          url: { type: 'string', example: 'https://cliente.com.br/webhooks/v2' },
          publicKey: { type: 'string', example: 'nova-chave-publica' },
          privateKey: {
            type: 'string',
            nullable: true,
            example: 'novo-segredo-hmac',
            description: 'Presente apenas quando as chaves foram alteradas nesta requisição.',
          },
          isActive: { type: 'boolean', example: true },
          circuitBreakerFailureCount: { type: 'number', example: 0 },
          circuitBreakerOpenUntil: { type: 'string', format: 'date-time', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_INPUT: {
              summary: 'URL inválida',
              value: {
                errorCode: 'INVALID_INPUT',
                message: ['url must be a URL address'],
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
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
