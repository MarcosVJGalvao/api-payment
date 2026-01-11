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
      status: 201,
      description: 'Webhook registrado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
          },
          name: { type: 'string', example: 'SANDBOX_BOLETO_CASH_IN' },
          context: { type: 'string', example: 'Boleto' },
          eventName: { type: 'string', example: 'BOLETO_CASH_IN_WAS_RECEIVED' },
          uri: { type: 'string', example: 'https://meuwebhook.com/123' },
          publicKey: {
            type: 'string',
            example: '872dc2ed-8bee-40b5-8465-5d2953ba76dp',
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
