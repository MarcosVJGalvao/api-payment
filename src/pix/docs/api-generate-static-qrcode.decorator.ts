import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiGenerateStaticQrCode() {
  return applyDecorators(
    ApiOperation({
      summary: 'Gerar QR Code Estático',
      description:
        'Gera um QR Code Pix estático. O QR Code estático pode ser utilizado várias vezes por pagadores diferentes.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: 'HIPERBANCO',
    }),
    ApiResponse({
      status: 201,
      description: 'QR Code estático gerado com sucesso',
      schema: {
        properties: {
          id: { type: 'string', format: 'uuid' },
          encodedValue: { type: 'string' },
          type: { type: 'string', example: 'STATIC' },
          status: { type: 'string', example: 'CREATED' },
          amount: { type: 'number' },
          conciliationId: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Dados inválidos' }),
    ApiResponse({ status: 401, description: 'Não autorizado' }),
    ApiResponse({ status: 500, description: 'Erro interno' }),
  );
}
