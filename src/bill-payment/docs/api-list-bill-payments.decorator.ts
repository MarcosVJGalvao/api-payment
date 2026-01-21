import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { BillPaymentStatus } from '../enums/bill-payment-status.enum';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiListBillPayments() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Listar pagamentos de contas',
      description: 'Lista os pagamentos de contas com paginação e filtros.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número da página (padrão: 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Itens por página (padrão: 10, máximo: 100)',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: BillPaymentStatus,
      description: 'Filtrar por status',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Buscar por linha digitável, cedente ou beneficiário',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de pagamentos',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                digitable: { type: 'string' },
                amount: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              lastPage: { type: 'number' },
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
