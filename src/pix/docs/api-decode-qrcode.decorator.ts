import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { DecodeQrCodeDto } from '../dto/decode-qr-code.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiDecodeQrCode() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Decodificar QR Code via Provedor',
      description:
        'Decodifica um QR Code Pix e retorna informações detalhadas sobre o pagamento, incluindo endToEndId necessário para realizar a transferência.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: DecodeQrCodeDto,
    }),
    ApiResponse({
      status: 200,
      description: 'QR Code decodificado com sucesso',
      schema: {
        type: 'object',
        properties: {
          endToEndId: { type: 'string', example: 'E13140088...' },
          conciliationId: { type: 'string' },
          qrCodeType: { type: 'string', enum: ['STATIC', 'DYNAMIC'] },
          addressingKey: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'CPF' },
              value: { type: 'string', example: '47742663023' },
            },
          },
          holder: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
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
    ApiResponse({
      status: 500,
      description: 'Erro interno',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PIX_QRCODE_DECODE_FAILED: {
              summary: 'Falha ao decodificar QR Code',
              value: {
                errorCode: 'PIX_QRCODE_DECODE_FAILED',
                message: 'Failed to decode QR Code',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
