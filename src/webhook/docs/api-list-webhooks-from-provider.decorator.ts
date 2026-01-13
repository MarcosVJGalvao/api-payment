import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiListWebhooksFromProvider() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar webhooks do provedor',
      description:
        'Lista todos os webhooks registrados diretamente no provedor financeiro. ' +
        'Esta rota é exclusiva para usuários internos do sistema.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Página atual (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Quantidade de itens por página (default: 10, max: 100)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de webhooks do provedor retornada com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
                },
                name: { type: 'string', example: 'SANDBOX_BOLETO_CASH_IN' },
                context: { type: 'string', example: 'Boleto' },
                eventName: {
                  type: 'string',
                  example: 'BOLETO_CASH_IN_WAS_RECEIVED',
                },
                uri: { type: 'string', example: 'https://meuwebhook.com/123' },
                publicKey: {
                  type: 'string',
                  example: '872dc2ed-8bee-40b5-8465-5d2953ba76dp',
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              total: { type: 'number', example: 3 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Acesso negado - apenas usuários internos',
    }),
  );
}
