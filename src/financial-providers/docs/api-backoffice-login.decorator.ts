import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { BackofficeLoginDto } from '../dto/backoffice-login.dto';

export function ApiBackofficeLogin() {
  return applyDecorators(
    ApiHeader({
      name: 'X-Client-Id',
      description:
        'ID do cliente (obrigatório pois emails podem existir em múltiplos clientes)',
      required: true,
      schema: { type: 'string' },
    }),
    ApiOperation({
      summary: 'Autenticar com o Backoffice do Hiperbanco',
      description:
        'Realiza a autenticação de um usuário backoffice no Hiperbanco. ' +
        'Retorna um token JWT interno para uso nas demais operações. ' +
        'Requer o header X-Client-Id para identificar o tenant.',
    }),
    ApiBody({
      type: BackofficeLoginDto,
      examples: {
        'Login Backoffice': {
          summary: 'Autenticar usuário backoffice',
          value: {
            email: 'admin@empresa.com.br',
            password: 'SenhaSegura123!',
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
          sessionId: {
            type: 'string',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Falha na autenticação',
      schema: {
        type: 'object',
        properties: {
          errorCode: { type: 'string', example: 'PROVIDER_AUTH_FAILED' },
          message: {
            type: 'string',
            example: 'Hiperbanco authentication failed: Invalid credentials',
          },
        },
      },
    }),
  );
}
