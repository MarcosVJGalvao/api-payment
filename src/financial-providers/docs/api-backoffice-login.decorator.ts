import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { BackofficeLoginDto } from '../dto/backoffice-login.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiBackofficeLogin() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiHeader({
      name: 'X-Client-Id',
      description: 'ID do cliente (obrigatório)',
      required: true,
      schema: { type: 'string' },
    }),
    ApiOperation({
      summary: 'Autenticar Backoffice Hiperbanco',
      description:
        'Autentica usuário backoffice no Hiperbanco. Requer header X-Client-Id.',
    }),
    ApiBody({
      type: BackofficeLoginDto,
      examples: {
        'Login Backoffice': {
          value: { email: 'admin@empresa.com.br', password: 'SenhaSegura123!' },
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
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Falha na autenticação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PROVIDER_AUTH_FAILED: {
              summary: 'Credenciais inválidas',
              value: {
                errorCode: 'PROVIDER_AUTH_FAILED',
                message:
                  'Hiperbanco authentication failed: Invalid credentials',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
