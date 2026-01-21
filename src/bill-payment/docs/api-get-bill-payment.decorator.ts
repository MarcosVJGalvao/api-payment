import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiGetBillPayment() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Buscar pagamento por ID',
      description:
        'Busca um pagamento de conta pelo ID interno. ' +
        'Sincroniza automaticamente os dados com o provedor financeiro.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID interno do pagamento',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    ApiResponse({
      status: 200,
      description: 'Pagamento encontrado',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', example: 'Completed' },
          digitable: { type: 'string' },
          authenticationCode: { type: 'string' },
          transactionId: { type: 'string' },
          assignor: { type: 'string' },
          originalAmount: { type: 'number' },
          amount: { type: 'number' },
          settleDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
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
      description: 'Acesso negado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            ACCESS_DENIED: {
              summary: 'Pagamento não pertence à conta',
              value: {
                errorCode: 'ACCESS_DENIED',
                message: 'Bill payment does not belong to this account',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Pagamento não encontrado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            BILL_PAYMENT_NOT_FOUND: {
              summary: 'Pagamento não encontrado',
              value: {
                errorCode: 'BILL_PAYMENT_NOT_FOUND',
                message: 'Bill payment not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
