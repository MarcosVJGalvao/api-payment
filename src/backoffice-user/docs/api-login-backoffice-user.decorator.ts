import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { LoginBackofficeUserDto } from '../dto/login-backoffice-user.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiLoginBackofficeUser() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Autenticar usuário Backoffice' }),
    ApiBody({
      type: LoginBackofficeUserDto,
      examples: {
        Login: {
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
          access_token: { type: 'string', example: 'jwt.token.here' },
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
            VALIDATION_ERROR: {
              summary: 'Dados inválidos',
              value: {
                errorCode: 'VALIDATION_ERROR',
                message: 'Validation failed',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
            INVALID_CREDENTIALS: {
              summary: 'Credenciais inválidas',
              value: {
                errorCode: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
