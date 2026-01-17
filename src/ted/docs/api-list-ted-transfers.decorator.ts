import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { TedTransferStatus } from '../enums/ted-transfer-status.enum';

export function ApiListTedTransfers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar transferências TED',
      description:
        'Retorna uma lista paginada de transferências TED da conta. ' +
        'Suporta filtros por status, data e busca por descrição.',
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
      example: 1,
      description: 'Número da página (inicia em 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Quantidade de itens por página (máx 100)',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: TedTransferStatus,
      example: TedTransferStatus.DONE,
      description: 'Filtrar por status da transferência',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      example: 'fornecedor',
      description: 'Buscar por descrição ou código de autenticação',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      example: '2026-01-01',
      description: 'Data inicial do período (formato: YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      example: '2026-01-31',
      description: 'Data final do período (formato: YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      example: 'createdAt',
      description: 'Campo para ordenação (createdAt, amount, status)',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      type: String,
      example: 'DESC',
      description: 'Direção da ordenação (ASC ou DESC)',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de transferências TED retornada com sucesso',
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
                  example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                },
                authenticationCode: {
                  type: 'string',
                  example: 'ABC123DEF456GHI789',
                },
                status: {
                  type: 'string',
                  example: TedTransferStatus.DONE,
                  enum: Object.values(TedTransferStatus),
                },
                amount: {
                  type: 'number',
                  example: 1500.0,
                },
                currency: {
                  type: 'string',
                  example: 'BRL',
                },
                description: {
                  type: 'string',
                  example: 'Pagamento de fornecedor',
                },
                sender: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'João da Silva' },
                    documentNumber: {
                      type: 'string',
                      example: '123.456.789-01',
                    },
                    accountNumber: { type: 'string', example: '123456' },
                    accountBranch: { type: 'string', example: '0001' },
                  },
                },
                recipient: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Maria Oliveira' },
                    documentNumber: {
                      type: 'string',
                      example: '987.654.321-00',
                    },
                    bankCode: { type: 'string', example: '341' },
                    accountNumber: { type: 'string', example: '654321' },
                    accountBranch: { type: 'string', example: '0001' },
                  },
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-01-17T10:00:00.000Z',
                },
                paymentDate: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-01-17T10:05:00.000Z',
                  nullable: true,
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              lastPage: { type: 'number', example: 10 },
              limit: { type: 'number', example: 10 },
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
      description: 'Sem permissão para listar transferências TED',
    }),
  );
}
