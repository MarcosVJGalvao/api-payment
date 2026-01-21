import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { DecodeBase64QrCodeDto } from '../dto/decode-base64-qr-code.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiDecodeBase64QrCode() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Decodificar Base64 para EMV (Pix Copia e Cola)',
      description:
        'Decodifica o valor Base64 de um QR Code e retorna o código EMV (Pix Copia e Cola).',
    }),
    ApiBody({
      type: DecodeBase64QrCodeDto,
    }),
    ApiResponse({
      status: 200,
      description: 'QR Code decodificado para EMV',
      schema: {
        type: 'object',
        properties: {
          emvCode: {
            type: 'string',
            description: 'Código EMV (Pix Copia e Cola)',
          },
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
            INVALID_INPUT: {
              summary: 'Valor Base64 inválido',
              value: {
                errorCode: 'INVALID_INPUT',
                message: 'Invalid Base64 encoded value',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
