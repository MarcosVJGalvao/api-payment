import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateBoletoDto } from '../dto/create-boleto.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiCreateBoleto() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: CreateBoletoDto,
      examples: {
        'Boleto de Depósito': {
          value: {
            alias: 'Depósito na conta',
            type: 'Deposit',
            amount: 500.0,
            dueDate: '2025-10-10',
            documentNumber: '12345678909',
            account: { branch: '0001', number: '123456', type: 'CHECKING' },
          },
        },
        'Boleto de Cobrança (Levy)': {
          value: {
            alias: 'Cobrança de Serviços',
            type: 'Levy',
            amount: 150.75,
            dueDate: '2025-10-15',
            closePayment: '2025-11-15',
            documentNumber: '09876543210',
            account: { branch: '0001', number: '654321', type: 'CHECKING' },
            payer: {
              name: 'João da Silva',
              document: '11122233344',
              address: {
                zipCode: '01001000',
                street: 'Praça da Sé',
                number: '1',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
              },
            },
          },
        },
      },
    }),
    ApiOperation({
      summary: 'Emitir boleto',
      description:
        'Emite um novo boleto no provedor financeiro especificado. Suporta dois tipos: Deposit (depósito) e Levy (cobrança).',
    }),
    ApiResponse({
      status: 201,
      description: 'Boleto emitido com sucesso',
      schema: {
        type: 'object',
        properties: {
          internalId: { type: 'string', format: 'uuid' },
          authenticationCode: { type: 'string' },
          barcode: { type: 'string' },
          digitable: { type: 'string' },
          status: { type: 'string', example: 'REGISTERED' },
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
            INVALID_BOLETO_DATES: {
              summary: 'Datas inválidas',
              value: {
                errorCode: 'INVALID_BOLETO_DATES',
                message: 'Boleto dates are invalid',
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
      status: 500,
      description: 'Erro interno',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            BOLETO_EMISSION_FAILED: {
              summary: 'Falha ao emitir boleto',
              value: {
                errorCode: 'BOLETO_EMISSION_FAILED',
                message: 'Failed to emit boleto in financial provider',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
