import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ConfirmBillPaymentDto } from '../dto/confirm-bill-payment.dto';

export function ApiConfirmBillPayment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Confirmar pagamento de conta',
      description:
        'Confirma o pagamento de um título previamente validado. ' +
        'O ID utilizado deve ser o retornado na etapa de validação.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro (ex: hiperbanco)',
      example: 'hiperbanco',
    }),
    ApiBody({ type: ConfirmBillPaymentDto }),
    ApiResponse({
      status: 201,
      description: 'Pagamento confirmado com sucesso',
      schema: {
        type: 'object',
        properties: {
          authenticationCode: {
            type: 'string',
            example: '37fb18db-21c9-4adb-b6e2-3b63d273ea1c',
          },
          settleDate: {
            type: 'string',
            example: '2025-08-22T00:00:00',
          },
          transactionId: {
            type: 'string',
            example: 'ecc3a74c-a25a-4f65-8449-5f850f90bf9d',
          },
          paymentId: {
            type: 'string',
            description: 'ID interno do pagamento persistido',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Falha na confirmação do pagamento',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
  );
}
