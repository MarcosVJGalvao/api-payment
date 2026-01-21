import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { PixTransferDto } from '../dto/pix-transfer.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiPixTransfer() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Realizar transferência PIX',
      description:
        'Executa uma transferência PIX utilizando chave, QR Code ou dados manuais da conta destinatária.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: PixTransferDto,
      examples: {
        'Transferência por Chave/EndToEndId': {
          value: {
            amount: 100.5,
            initializationType: 'Key',
            description: 'Pagamento Serviço',
            endToEndId: 'E13140088202507090058341B5EC16CC',
            pixKey: '47742663023',
          },
        },
        'Transferência via Static QR Code': {
          value: {
            amount: 50.0,
            initializationType: 'StaticQrCode',
            description: 'Pagamento QR Code Estático',
            endToEndId: 'E13140088202507090058341B5EC16CC',
            pixKey: '47742663023',
            conciliationId: 'FiCapc7D0Ul7KHDOnZp8HGaCS',
          },
        },
        'Transferência via Dynamic QR Code': {
          value: {
            amount: 75.25,
            initializationType: 'DynamicQrCode',
            description: 'Pagamento QR Code Dinâmico',
            endToEndId: 'E13140088202507090058341B5EC16CC',
            pixKey: '47742663023',
            receiverReconciliationId: 'Jk6GDZxqDD0HizWOfIYxGosIn9',
          },
        },
        'Transferência Manual (Agência e Conta)': {
          value: {
            amount: 1500.0,
            initializationType: 'Manual',
            description: 'Transferência para Conta Corrente',
            recipient: {
              name: 'Alberto Gilberto',
              documentNumber: '52145638795',
              account: {
                branch: '0001',
                number: '1101263307',
                type: 'CHECKING',
              },
              bank: { ispb: '13140088' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Transferência realizada com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', example: 'PROCESSING' },
          amount: { type: 'number', example: 100.5 },
          transactionId: { type: 'string' },
          authenticationCode: { type: 'string' },
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
            ACCOUNT_NOT_FOUND: {
              summary: 'Onboarding não encontrado',
              value: {
                errorCode: 'ACCOUNT_NOT_FOUND',
                message: 'Account onboarding not found',
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
            PIX_TRANSFER_FAILED: {
              summary: 'Falha na transferência PIX',
              value: {
                errorCode: 'PIX_TRANSFER_FAILED',
                message: 'Failed to process PIX transfer',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
