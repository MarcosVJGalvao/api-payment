import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ReprocessWebhookMessagesDto } from '../dto/reprocess-webhook-messages.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiReprocessWebhookMessages() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto, ReprocessWebhookMessagesDto),
    ApiOperation({
      summary: 'Reprocessar mensagens de webhook com falha',
      description:
        'Reenfileira mensagens com status `FAILED` para nova tentativa de entrega. ' +
        'Aceita uma lista de IDs específicos **ou** um `configurationId` para reprocessar ' +
        'todas as mensagens com falha de uma configuração. Pelo menos um dos dois deve ser informado.',
    }),
    ApiBody({
      type: ReprocessWebhookMessagesDto,
      examples: {
        'Por lista de IDs': {
          summary: 'Reprocessar IDs específicos',
          value: {
            ids: [
              '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
              'b7e3a1c2-8d4f-4e9b-a3c2-1b5f8e2a7d0c',
            ],
          },
        },
        'Por configuração': {
          summary: 'Reprocessar todos os FAILED de uma configuração',
          value: {
            configurationId: '9a1b2c3d-4e5f-6789-abcd-ef0123456789',
          },
        },
      },
    }),
    ApiResponse({
      status: 202,
      description: 'Mensagens enfileiradas para reprocessamento',
      schema: {
        type: 'object',
        properties: {
          queued: {
            type: 'number',
            description: 'Quantidade de mensagens adicionadas à fila',
            example: 5,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Nenhum filtro informado ou IDs inválidos',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_INPUT: {
              summary: 'ID não é um UUID válido',
              value: {
                errorCode: 'INVALID_INPUT',
                message: ['ids.0 must be a UUID'],
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
