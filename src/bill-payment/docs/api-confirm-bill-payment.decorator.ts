import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ConfirmBillPaymentDto } from '../dto/confirm-bill-payment.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiConfirmBillPayment() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Confirmar pagamento de conta',
      description:
        'Confirma o pagamento de um título previamente validado. ' +
        'O ID utilizado deve ser o retornado na etapa de validação.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: ConfirmBillPaymentDto,
      examples: {
        'Pagamento Simples': {
          summary: 'Confirmar pagamento de conta',
          value: {
            id: 'b985967b-a0ed-4810-addd-ec100b128171',
            bankBranch: '0001',
            bankAccount: '1104835921',
            amount: 200.0,
            description: 'Pagamento de conta de luz',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Pagamento confirmado com sucesso',
      schema: {
        type: 'object',
        properties: {
          authenticationCode: { type: 'string' },
          settleDate: { type: 'string', format: 'date-time' },
          transactionId: { type: 'string' },
          paymentId: { type: 'string', description: 'ID interno do pagamento' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Erro de validação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            BILL_PAYMENT_CONFIRMATION_FAILED: {
              summary: 'Falha na confirmação do pagamento',
              value: {
                errorCode: 'BILL_PAYMENT_CONFIRMATION_FAILED',
                message: 'Failed to confirm bill payment',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
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
