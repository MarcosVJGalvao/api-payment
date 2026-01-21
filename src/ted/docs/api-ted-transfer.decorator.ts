import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateTedDto } from '../dto/create-ted.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiTedTransfer() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Realizar transferência via TED',
      description:
        'Executa uma transferência bancária via TED para a conta do destinatário especificado.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: CreateTedDto,
      examples: {
        'Transferência para Pessoa Física - Conta Corrente': {
          summary: 'TED para CPF em Conta Corrente',
          description: 'Transferência TED para pessoa física em conta corrente',
          value: {
            amount: 1500.0,
            description: 'Pagamento de fornecedor',
            idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            recipient: {
              document: '98765432100',
              name: 'Maria Oliveira',
              bankCode: '341',
              branch: '0001',
              account: '654321',
              accountType: 'CHECKING',
            },
          },
        },
        'Transferência para Pessoa Jurídica - Conta Corrente': {
          summary: 'TED para CNPJ em Conta Corrente',
          description: 'Transferência TED para empresa em conta corrente',
          value: {
            amount: 25000.0,
            description: 'Pagamento de serviços prestados',
            recipient: {
              document: '98765432000188',
              name: 'Fornecedor ABC S/A',
              bankCode: '237',
              branch: '0234',
              account: '987654321',
              accountType: 'CHECKING',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Transferência TED criada com sucesso',
      schema: {
        type: 'object',
        properties: {
          authenticationCode: {
            type: 'string',
            example: 'ABC123DEF456GHI789',
            description: 'Código de autenticação retornado pelo provedor',
          },
          transactionId: {
            type: 'string',
            example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            description: 'ID da transação no provedor',
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
            RESOURCE_NOT_FOUND: {
              summary: 'Conta origem não encontrada',
              value: {
                errorCode: 'RESOURCE_NOT_FOUND',
                message: 'Sender account not found',
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
            EXTERNAL_SERVICE_ERROR: {
              summary: 'Erro no provedor financeiro',
              value: {
                errorCode: 'EXTERNAL_SERVICE_ERROR',
                message: 'Failed to execute TED at provider',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
