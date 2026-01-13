import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiRegisterWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar um webhook em um provedor financeiro',
      description:
        'Registra um webhook no provedor especificado (ex: Hiperbanco) para receber notificações de eventos. ' +
        'Requer autenticação de backoffice via Bearer token. ' +
        'O webhook é registrado na API do provedor e os dados são persistidos localmente para rastreamento.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Identificador do provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
      required: true,
    }),
    ApiBody({
      type: RegisterWebhookDto,
      examples: {
        'Webhook para Boleto': {
          summary: 'Registrar webhook para eventos de Boleto',
          value: {
            name: 'SANDBOX_BOLETO_CASH_IN',
            context: 'Boleto',
            uri: 'https://meuwebhook.com/boleto',
            eventName: 'BOLETO_CASH_IN_WAS_RECEIVED',
          },
        },
        'Webhook para PIX': {
          summary: 'Registrar webhook para eventos de PIX',
          value: {
            name: 'SANDBOX_PIX_CASH_IN',
            context: 'Pix',
            uri: 'https://meuwebhook.com/pix',
            eventName: 'PIX_CASH_IN_WAS_CLEARED',
          },
        },
        'Webhook para Pagamentos': {
          summary: 'Registrar webhook para eventos de pagamentos',
          value: {
            name: 'SANDBOX_PAYMENT_COMPLETED',
            context: 'Payment',
            uri: 'https://meuwebhook.com/payment',
            eventName: 'PAYMENT_WAS_COMPLETED',
          },
        },
      },
    }),
    ApiResponse({
      status: 202,
      description:
        'Requisição de registro de webhook recebida e está sendo processada',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Webhook registration queued',
          },
          status: {
            type: 'string',
            example: 'PROCESSING',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
      schema: {
        type: 'object',
        properties: {
          errorCode: { type: 'string', example: 'INVALID_TOKEN' },
          message: {
            type: 'string',
            example: 'Token de autenticação inválido ou expirado',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Requer autenticação de backoffice',
      schema: {
        type: 'object',
        properties: {
          errorCode: { type: 'string', example: 'INSUFFICIENT_PERMISSION' },
          message: {
            type: 'string',
            example: 'Esta operação requer autenticação de backoffice',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Provedor não suportado ou erro de validação',
      schema: {
        type: 'object',
        properties: {
          errorCode: { type: 'string', example: 'INVALID_INPUT' },
          message: { type: 'string', example: 'Provider xyz não suportado' },
        },
      },
    }),
  );
}
