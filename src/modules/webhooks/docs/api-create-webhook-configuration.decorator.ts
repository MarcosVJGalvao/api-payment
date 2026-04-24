import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateWebhookConfigurationDto } from '../dto/create-webhook-configuration.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

const configurationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    clientId: { type: 'string', format: 'uuid' },
    eventType: { type: 'string', enum: Object.values(ApiPaymentWebhookEventType) },
    url: { type: 'string', example: 'https://cliente.com.br/webhooks/api-payment' },
    publicKey: { type: 'string', example: 'pub_abc123' },
    privateKey: {
      type: 'string',
      example: 'priv_xyz789',
      description: 'Retornado apenas na criação. Guarde com segurança.',
    },
    isActive: { type: 'boolean', example: true },
    circuitBreakerFailureCount: { type: 'number', example: 0 },
    circuitBreakerOpenUntil: { type: 'string', format: 'date-time', nullable: true, example: null },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export function ApiCreateWebhookConfiguration() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto, CreateWebhookConfigurationDto),
    ApiOperation({
      summary: 'Criar configuração de webhook outbound',
      description:
        'Cria uma configuração de webhook para despacho de eventos para o cliente integrador. ' +
        'O par de chaves HMAC é gerado automaticamente caso não seja informado. ' +
        '**Atenção:** a `privateKey` é retornada apenas nesta resposta — armazene-a com segurança.',
    }),
    ApiBody({
      type: CreateWebhookConfigurationDto,
      examples: {
        'Com geração automática de chaves': {
          summary: 'Chaves geradas pela API',
          value: {
            eventType: ApiPaymentWebhookEventType.PIX_CASH_OUT_COMPLETED,
            url: 'https://cliente.com.br/webhooks/api-payment',
          },
        },
        'Com chaves fornecidas pelo cliente': {
          summary: 'Chaves informadas manualmente',
          value: {
            eventType: ApiPaymentWebhookEventType.TED_CASH_OUT_COMPLETED,
            url: 'https://cliente.com.br/webhooks/ted',
            publicKey: 'minha-chave-publica',
            privateKey: 'meu-segredo-hmac-muito-seguro',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Configuração criada com sucesso. `privateKey` incluída nesta resposta.',
      schema: configurationSchema,
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_INPUT: {
              summary: 'URL inválida ou eventType desconhecido',
              value: {
                errorCode: 'INVALID_INPUT',
                message: ['url must be a URL address', 'eventType must be a valid enum value'],
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
