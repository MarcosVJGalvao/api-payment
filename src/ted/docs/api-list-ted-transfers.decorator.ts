import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { TedTransferStatus } from '../enums/ted-transfer-status.enum';

export function ApiListTedTransfers() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
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
                status: { type: 'string', example: TedTransferStatus.DONE },
                amount: { type: 'number', example: 1500.0 },
                currency: { type: 'string', example: 'BRL' },
                description: {
                  type: 'string',
                  example: 'Pagamento de fornecedor',
                },
                createdAt: { type: 'string', format: 'date-time' },
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
