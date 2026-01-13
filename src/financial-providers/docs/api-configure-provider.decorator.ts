import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateProviderCredentialDto } from '../dto/create-provider-credential.dto';
import { ProviderCredential } from '../entities/provider-credential.entity';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiConfigureProvider() {
  return applyDecorators(
    ApiOperation({
      summary: 'Criar ou atualizar credenciais de um provedor financeiro',
      description:
        'Salva as credenciais de acesso (usuário/senha) para integração com um provedor financeiro externo. ' +
        'A senha é criptografada antes de ser armazenada no banco de dados. ' +
        'Se as credenciais já existirem para o provedor, serão atualizadas.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
      required: true,
    }),
    ApiBody({
      type: CreateProviderCredentialDto,
      examples: {
        'Credenciais de Backoffice': {
          description: 'Login administrativo com email e senha',
          value: {
            loginType: 'backoffice',
            login: 'admin@empresa.com.br',
            password: 'SuperSecretPassword123!',
          } as CreateProviderCredentialDto,
        },
        'Credenciais Bancárias (API)': {
          description: 'Login de integração bancária com documento e senha',
          value: {
            loginType: 'bank',
            login: '12345678000199',
            password: 'BankApiPassword456!',
          } as CreateProviderCredentialDto,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Credenciais salvas com sucesso',
      type: ProviderCredential,
    }),
    ApiResponse({
      status: 400,
      description: 'Erro de validação',
      schema: {
        type: 'object',
        properties: {
          errorCode: {
            type: 'string',
            example: 'INVALID_INPUT',
          },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'login should not be empty',
              'password must be longer than or equal to 6 characters',
            ],
          },
          correlationId: {
            type: 'string',
            example: 'c113416d-2180-4141-9965-c14f93046977',
          },
        },
      },
    }),
  );
}
