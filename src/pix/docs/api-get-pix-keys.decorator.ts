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

export function ApiGetPixKeys() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Consultar chaves PIX',
      description:
        'Retorna a lista de chaves PIX vinculadas à conta do usuário autenticado.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de chaves PIX retornada com sucesso',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              example: 'EMAIL',
              description: 'Tipo da chave (CPF, CNPJ, EMAIL, PHONE, EVP)',
            },
            value: {
              type: 'string',
              example: 'carlos.neto@hiperbanco.com.br',
              description: 'Valor da chave',
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
            PIX_KEY_QUERY_FAILED: {
              summary: 'Falha ao consultar chaves PIX',
              value: {
                errorCode: 'PIX_KEY_QUERY_FAILED',
                message: 'Failed to query PIX keys',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
