import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiListWebhooks() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Listar webhooks registrados',
      description:
        'Retorna a lista paginada de webhooks registrados no provedor. ' +
        'Permite filtrar por status (Enabled/Disabled).',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de webhooks',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                eventName: { type: 'string' },
                context: { type: 'string' },
                uri: { type: 'string' },
                status: { type: 'string', enum: ['Enabled', 'Disabled'] },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              pageSize: { type: 'number' },
              total: { type: 'number' },
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
