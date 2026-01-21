import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateProviderCredentialDto } from '../dto/create-provider-credential.dto';
import { ProviderCredential } from '../entities/provider-credential.entity';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiConfigureProvider() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Criar ou atualizar credenciais do provedor',
      description:
        'Salva credenciais para integração com provedor financeiro. Senha criptografada antes de armazenar.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: CreateProviderCredentialDto,
      examples: {
        'Credenciais Backoffice': {
          value: {
            loginType: 'backoffice',
            login: 'admin@empresa.com.br',
            password: 'SuperSecretPassword123!',
          },
        },
        'Credenciais Bank': {
          value: {
            loginType: 'bank',
            login: '12345678000199',
            password: 'BankApiPassword456!',
          },
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
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_INPUT: {
              summary: 'Dados inválidos',
              value: {
                errorCode: 'INVALID_INPUT',
                message: [
                  'login should not be empty',
                  'password must be longer than or equal to 6 characters',
                ],
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
  );
}
