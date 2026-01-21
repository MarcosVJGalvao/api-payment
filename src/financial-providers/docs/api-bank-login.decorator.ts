import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { BankLoginDto } from '../dto/bank-login.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiBankLogin() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Autenticar para operações bancárias',
      description:
        'Autentica usuário final para operações bancárias. ' +
        'Retorna token JWT com accountId para operações.',
    }),
    ApiBody({
      type: BankLoginDto,
      examples: {
        'Login CPF': {
          summary: 'Pessoa física',
          value: { document: '47742663023', password: 'SenhaSegura123@' },
        },
        'Login CNPJ': {
          summary: 'Pessoa jurídica',
          value: { document: '12345678000199', password: 'SenhaEmpresa456!' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login realizado com sucesso',
      schema: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          sessionId: { type: 'string' },
          documentNumber: { type: 'string' },
          registerName: { type: 'string' },
          accounts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                branch: { type: 'string' },
                number: { type: 'string' },
                type: { type: 'string' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Credenciais inválidas',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PROVIDER_AUTH_FAILED: {
              summary: 'Falha na autenticação bancária',
              value: {
                errorCode: 'PROVIDER_AUTH_FAILED',
                message: 'Falha na autenticação bancária: Invalid credentials',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
