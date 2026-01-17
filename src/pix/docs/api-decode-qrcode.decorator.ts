import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiDecodeQrCode() {
  return applyDecorators(
    ApiOperation({
      summary: 'Decodificar QR Code via Provedor',
      description:
        'Decodifica um QR Code Pix e retorna informações detalhadas sobre o pagamento, incluindo endToEndId necessário para realizar a transferência.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: 'HIPERBANCO',
    }),
    ApiResponse({
      status: 200,
      description: 'QR Code decodificado com sucesso',
      schema: {
        properties: {
          endToEndId: { type: 'string' },
          conciliationId: { type: 'string' },
          qrCodeType: { type: 'string', enum: ['STATIC', 'DYNAMIC'] },
          addressingKey: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              value: { type: 'string' },
            },
          },
          payment: {
            type: 'object',
            properties: {
              totalValue: { type: 'number' },
              isSinglePayment: { type: 'boolean' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Dados inválidos' }),
    ApiResponse({ status: 401, description: 'Não autorizado' }),
    ApiResponse({ status: 500, description: 'Erro interno' }),
  );
}
