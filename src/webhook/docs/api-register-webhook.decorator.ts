import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiRegisterWebhook() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Registrar webhook em provedor financeiro',
      description:
        'Registra um webhook no provedor especificado para receber notificações de eventos. ' +
        'Requer autenticação de backoffice.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: RegisterWebhookDto,
      examples: {
        'Webhook PIX': {
          value: {
            name: 'SANDBOX_PIX_CASH_IN',
            context: 'Pix',
            uri: 'https://meuwebhook.com/pix',
            eventName: 'PIX_CASH_IN_WAS_CLEARED',
          },
        },
        'Webhook Boleto': {
          value: {
            name: 'SANDBOX_BOLETO_CASH_IN',
            context: 'Boleto',
            uri: 'https://meuwebhook.com/boleto',
            eventName: 'BOLETO_CASH_IN_WAS_RECEIVED',
          },
        },
      },
    }),
    ApiResponse({
      status: 202,
      description: 'Requisição de registro processando',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Webhook registration queued' },
          status: { type: 'string', example: 'PROCESSING' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Erro de validação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_INPUT: {
              summary: 'Provedor não suportado',
              value: {
                errorCode: 'INVALID_INPUT',
                message: 'Provider xyz não suportado',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
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
      description: 'Permissão insuficiente',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INSUFFICIENT_PERMISSION: {
              summary: 'Requer autenticação de backoffice',
              value: {
                errorCode: 'INSUFFICIENT_PERMISSION',
                message: 'Esta operação requer autenticação de backoffice',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
