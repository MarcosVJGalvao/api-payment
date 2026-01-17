import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

export function ApiDecodeBase64QrCode() {
  return applyDecorators(
    ApiOperation({
      summary: 'Decodificar Base64 para EMV (Pix Copia e Cola)',
      description:
        'Decodifica o valor Base64 de um QR Code e retorna o código EMV (Pix Copia e Cola).',
    }),
    ApiBody({
      schema: {
        properties: {
          encodedValue: {
            type: 'string',
            description: 'Valor codificado em Base64 do QR Code',
          },
        },
        required: ['encodedValue'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'QR Code decodificado para EMV',
      schema: {
        properties: {
          emvCode: {
            type: 'string',
            description: 'Código EMV (Pix Copia e Cola)',
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Valor Base64 inválido' }),
  );
}
