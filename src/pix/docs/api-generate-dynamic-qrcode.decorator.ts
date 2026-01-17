import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiGenerateDynamicQrCode() {
  return applyDecorators(
    ApiOperation({
      summary: 'Gerar QR Code Dinâmico',
      description:
        'Gera um QR Code Pix dinâmico. O QR Code dinâmico pode ter validade e configuração de pagamento único.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: 'HIPERBANCO',
    }),
    ApiResponse({
      status: 201,
      description: 'QR Code dinâmico gerado com sucesso',
      schema: {
        properties: {
          id: { type: 'string', format: 'uuid' },
          encodedValue: { type: 'string' },
          type: { type: 'string', example: 'DYNAMIC' },
          status: { type: 'string', example: 'CREATED' },
          amount: { type: 'number' },
          conciliationId: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
          singlePayment: { type: 'boolean' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Dados inválidos' }),
    ApiResponse({ status: 401, description: 'Não autorizado' }),
    ApiResponse({ status: 500, description: 'Erro interno' }),
  );
}
