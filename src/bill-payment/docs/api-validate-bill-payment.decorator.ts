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

export function ApiValidateBillPayment() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Validar título para pagamento',
      description:
        'Valida um título pela linha digitável e retorna os dados para confirmação do pagamento. ' +
        'Esta é a primeira etapa do processo de pagamento de conta.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'digitable',
      description: 'Linha digitável do título (código de barras numérico)',
      example: '34191090080025732445903616490003691150000020000',
    }),
    ApiResponse({
      status: 200,
      description: 'Título validado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'b985967b-a0ed-4810-addd-ec100b128171',
          },
          assignor: { type: 'string', example: 'BANCO ITAU S.A.' },
          recipient: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              documentNumber: { type: 'string' },
            },
          },
          payer: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              documentNumber: { type: 'string' },
            },
          },
          dueDate: { type: 'string', format: 'date-time' },
          originalAmount: { type: 'number' },
          amount: { type: 'number' },
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
            BILL_PAYMENT_VALIDATION_FAILED: {
              summary: 'Falha na validação do título',
              value: {
                errorCode: 'BILL_PAYMENT_VALIDATION_FAILED',
                message: 'Failed to validate bill payment',
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
