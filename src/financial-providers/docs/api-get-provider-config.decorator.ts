import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProviderCredential } from '../entities/provider-credential.entity';
import { ProviderLoginType } from '../enums/provider-login-type.enum';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiGetProviderConfig() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Obter configuração do provedor',
      description:
        'Retorna credenciais configuradas para o provedor. Senha ocultada por segurança.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'loginType',
      description: 'Tipo de login',
      enum: ProviderLoginType,
      example: ProviderLoginType.BACKOFFICE,
    }),
    ApiResponse({
      status: 200,
      description: 'Configuração retornada com sucesso',
      type: ProviderCredential,
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
      description: 'Credenciais não encontradas',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PROVIDER_CREDENTIALS_NOT_FOUND: {
              summary: 'Credenciais do provedor não encontradas',
              value: {
                errorCode: 'PROVIDER_CREDENTIALS_NOT_FOUND',
                message: 'Credenciais do provedor hiperbanco não encontradas',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
