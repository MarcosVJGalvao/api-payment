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

export function ApiGenerateDynamicQrCode() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Gerar QR Code Dinâmico',
      description:
        'Gera um QR Code Pix dinâmico. O QR Code dinâmico pode ter validade e configuração de pagamento único.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiResponse({
      status: 201,
      description: 'QR Code dinâmico gerado com sucesso',
      schema: {
        type: 'object',
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
                message: 'Failed to generate dynamic QR Code',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
