import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateTedDto } from '../dto/create-ted.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiTedTransfer() {
  return applyDecorators(
    ApiOperation({ summary: 'Realizar transferência via TED' }),
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
          description:
            'Transferência TED para pessoa física em conta corrente no Itaú',
          value: {
            amount: 1500.0,
            description: 'Pagamento de fornecedor',
            idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            sender: {
              document: '12345678901',
              name: 'João da Silva',
              branch: '0001',
              account: '123456',
            },
            recipient: {
              document: '98765432100',
              name: 'Maria Oliveira',
              bankCode: '341',
              branch: '0001',
              account: '654321',
              accountType: 'CHECKING',
            },
          } as CreateTedDto,
        },
        'Transferência para Pessoa Jurídica - Conta Corrente': {
          summary: 'TED para CNPJ em Conta Corrente',
          description:
            'Transferência TED para empresa em conta corrente no Bradesco',
          value: {
            amount: 25000.0,
            description: 'Pagamento de serviços prestados',
            sender: {
              document: '12345678000199',
              name: 'Empresa XYZ Ltda',
              branch: '0001',
              account: '123456789',
            },
            recipient: {
              document: '98765432000188',
              name: 'Fornecedor ABC S/A',
              bankCode: '237',
              branch: '0234',
              account: '987654321',
              accountType: 'CHECKING',
            },
          } as CreateTedDto,
        },
        'Transferência para Pessoa Física - Conta Poupança': {
          summary: 'TED para CPF em Conta Poupança',
          description:
            'Transferência TED para pessoa física em conta poupança na Caixa',
          value: {
            amount: 500.0,
            description: 'Transferência pessoal',
            sender: {
              document: '12345678901',
              name: 'João da Silva',
              branch: '0001',
              account: '123456',
            },
            recipient: {
              document: '11122233344',
              name: 'Carlos Pereira',
              bankCode: '104',
              branch: '1234',
              account: '00123456',
              accountType: 'SAVINGS',
            },
          } as CreateTedDto,
        },
        'Transferência com Valor Mínimo': {
          summary: 'TED com valor mínimo permitido',
          description: 'Transferência TED com valor mínimo de R$ 0,01',
          value: {
            amount: 0.01,
            description: 'Teste de transferência',
            sender: {
              document: '12345678901',
              name: 'Teste Usuario',
              branch: '0001',
              account: '111111',
            },
            recipient: {
              document: '99988877766',
              name: 'Destinatário Teste',
              bankCode: '001',
              branch: '0001',
              account: '222222',
              accountType: 'CHECKING',
            },
          } as CreateTedDto,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Transferência TED criada com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            description: 'ID único da transferência TED',
          },
          authenticationCode: {
            type: 'string',
            example: 'ABC123DEF456GHI789',
            description: 'Código de autenticação retornado pelo provedor',
          },
          status: {
            type: 'string',
            example: 'CREATED',
            description: 'Status atual da transferência',
          },
          amount: {
            type: 'number',
            example: 1500.0,
            description: 'Valor da transferência',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-17T10:00:00.000Z',
            description: 'Data de criação',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos ou erro de validação',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'string',
            example: 'Dados inválidos para transferência TED',
          },
          errorCode: { type: 'string', example: 'TED_TRANSFER_FAILED' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Sem permissão para realizar transferências TED',
    }),
    ApiResponse({
      status: 422,
      description: 'Saldo insuficiente ou conta inválida',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 422 },
          message: {
            type: 'string',
            example: 'Saldo insuficiente para realizar a transferência',
          },
          errorCode: { type: 'string', example: 'INSUFFICIENT_BALANCE' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno do servidor',
    }),
  );
}
