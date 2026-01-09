import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiGetBillPayment() {
  return applyDecorators(
    ApiBearerAuth(),
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
          recipientName: { type: 'string' },
          recipientDocument: { type: 'string' },
          originalAmount: { type: 'number' },
          amount: { type: 'number' },
          dueDate: { type: 'string' },
          settleDate: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Pagamento não encontrado',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
  );
}
