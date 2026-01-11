import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BankLoginDto } from '../dto/bank-login.dto';

export function ApiBankLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Autenticar usuário para operações bancárias',
      description:
        'Realiza a autenticação de um usuário final para operações bancárias no Hiperbanco. ' +
        'O documento (CPF/CNPJ) e senha são fornecidos pela requisição e validados diretamente na API do provedor. ' +
        'Retorna um token JWT que contém o accountId para uso nas demais operações.',
    }),
    ApiBody({
      type: BankLoginDto,
      examples: {
        'Login com CPF': {
          summary: 'Login de pessoa física',
          value: {
            document: '47742663023',
            password: 'SenhaSegura123@',
          },
        },
        'Login com CNPJ': {
          summary: 'Login de pessoa jurídica',
          value: {
            document: '12345678000199',
            password: 'SenhaEmpresa456!',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login realizado com sucesso',
      schema: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          sessionId: { type: 'string', example: 'session-id-123' },
          documentNumber: {
            type: 'string',
            example: '12345678900',
            description: 'CPF ou CNPJ do usuário',
          },
          registerName: {
            type: 'string',
            example: 'João Silva',
            description: 'Nome de registro do usuário',
          },
          accounts: {
            type: 'array',
            description:
              'Array de contas do usuário (originais do response do Hiperbanco)',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '5e7c38a7-8b2b-48a3-913f-0cebc6a89b04',
                  description: 'ID da conta no provedor financeiro',
                },
                status: {
                  type: 'string',
                  example: 'ACTIVE',
                  description: 'Status da conta',
                },
                branch: {
                  type: 'string',
                  example: '0001',
                  description: 'Agência da conta',
                },
                number: {
                  type: 'string',
                  example: '1105329590',
                  description: 'Número da conta',
                },
                type: {
                  type: 'string',
                  example: 'MAIN',
                  description: 'Tipo da conta (MAIN ou SAVINGS)',
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Credenciais inválidas',
      schema: {
        type: 'object',
        properties: {
          errorCode: { type: 'string', example: 'PROVIDER_AUTH_FAILED' },
          message: {
            type: 'string',
            example:
              'Falha na autenticação bancária Hiperbanco: Invalid credentials',
          },
        },
      },
    }),
  );
}
