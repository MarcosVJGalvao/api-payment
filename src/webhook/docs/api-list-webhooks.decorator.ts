import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiListWebhooks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar webhooks registrados em um provedor financeiro',
      description:
        'Retorna a lista paginada de webhooks registrados no provedor especificado. ' +
        'Permite filtrar por status (Enabled/Disabled) e paginar os resultados.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Identificador do provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de webhooks retornada com sucesso',
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
                  example: '15aab67f-18fe-45d3-8b7b-e999de104b04',
                },
                name: { type: 'string', example: 'WEBHOOK_PIX' },
                eventName: {
                  type: 'string',
                  example: 'PIX_CASH_IN_WAS_CLEARED',
                },
                context: { type: 'string', example: 'Pix' },
                uri: { type: 'string', example: 'https://webhook.site/abc123' },
                publicKey: {
                  type: 'string',
                  example: 'MGE4NDIwM2ItNmU5Yi00Zjk0LWE5NmEtNWIwMDdiOGVjMjJk',
                },
                createdAt: {
                  type: 'string',
                  example: '2021-11-22T14:11:30.18',
                },
                updatedAt: {
                  type: 'string',
                  example: '2021-11-22T18:58:23.273',
                },
                status: {
                  type: 'string',
                  enum: ['Enabled', 'Disabled'],
                  example: 'Enabled',
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              pageSize: { type: 'number', example: 10 },
              total: { type: 'number', example: 13 },
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
      description: 'Requer autenticação de backoffice',
    }),
  );
}
