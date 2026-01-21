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

export function ApiValidatePixKey() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Validar chave PIX',
      description:
        'Consulta os dados de uma chave PIX no DICT (Diretório de Identificadores de Contas Transacionais).',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'addressingKey',
      description:
        'Chave PIX a ser validada (CPF, CNPJ, email, telefone ou EVP)',
      example: '47742663023',
    }),
    ApiResponse({
      status: 200,
      description: 'Dados da chave PIX consultados com sucesso',
      schema: {
        type: 'object',
        properties: {
          endToEndId: { type: 'string', example: 'E13140088...' },
          addressingKey: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'CPF' },
              value: { type: 'string', example: '47742663023' },
            },
          },
          account: {
            type: 'object',
            properties: {
              bank: {
                type: 'object',
                properties: {
                  ispb: { type: 'string', example: '13140088' },
                },
              },
            },
          },
          holder: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'NATURAL_PERSON' },
              name: { type: 'string', example: 'João da Silva' },
              document: {
                type: 'object',
                properties: {
                  value: { type: 'string', example: '47742663023' },
                  type: { type: 'string', example: 'CPF' },
                },
              },
            },
          },
          status: { type: 'string', example: 'ACTIVE' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          ownedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
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
            PIX_KEY_QUERY_FAILED: {
              summary: 'Falha ao validar chave PIX',
              value: {
                errorCode: 'PIX_KEY_QUERY_FAILED',
                message: 'Failed to validate PIX key',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
