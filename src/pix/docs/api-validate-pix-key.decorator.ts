import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiValidatePixKey() {
  return applyDecorators(
    ApiOperation({ summary: 'Validar chave PIX' }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'addressingKey',
      description: 'Chave PIX a ser validada',
    }),
    ApiResponse({
      status: 200,
      description: 'Chave válida',
      schema: {
        type: 'object',
        properties: {
          isValid: { type: 'boolean', example: true },
          name: { type: 'string', example: 'John Doe' },
          document: { type: 'string', example: '12345678909' },
          pspName: { type: 'string', example: 'Banco Example S.A.' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Chave inválida ou erro na validação',
    }),
    ApiResponse({
      status: 404,
      description: 'Chave não encontrada',
    }),
  );
}
