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

export function ApiGenerateStaticQrCode() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Gerar QR Code Estático',
      description:
        'Gera um QR Code Pix estático. O QR Code estático pode ser utilizado várias vezes por pagadores diferentes.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiResponse({
      status: 201,
      description: 'QR Code estático gerado com sucesso',
      schema: {
        type: 'object',
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
      status: 404,
      description: 'Recurso não encontrado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            ACCOUNT_NOT_FOUND: {
              summary: 'Conta não encontrada',
              value: {
                errorCode: 'ACCOUNT_NOT_FOUND',
                message: 'Account not found',
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
            PIX_QRCODE_GENERATION_FAILED: {
              summary: 'Falha ao gerar QR Code',
              value: {
                errorCode: 'PIX_QRCODE_GENERATION_FAILED',
                message: 'Failed to generate static QR Code',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
