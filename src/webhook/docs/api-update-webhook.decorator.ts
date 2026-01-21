import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiUpdateWebhook() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Atualizar Webhook',
      description:
        'Atualiza a configuração de um webhook existente. Atualmente suporta apenas alteração da URI.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'id',
      description: 'ID do webhook no provedor',
      example: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
    }),
    ApiBody({
      type: UpdateWebhookDto,
      examples: {
        'Atualizar URI': {
          value: { uri: 'https://novourlwebhook.com/callback' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Webhook atualizado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          context: { type: 'string' },
          eventName: { type: 'string' },
          uri: { type: 'string' },
          publicKey: { type: 'string' },
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
              summary: 'Dados inválidos',
              value: {
                errorCode: 'INVALID_INPUT',
                message: 'Invalid webhook data',
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
  );
}
