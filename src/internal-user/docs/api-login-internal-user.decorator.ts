import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { LoginInternalUserDto } from '../dto/login-internal-user.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiLoginInternalUser() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Login de usuário interno' }),
    ApiBody({
      type: LoginInternalUserDto,
      examples: {
        'Login Interno': {
          summary: 'Autenticar usuário interno do sistema',
          value: {
            email: 'sistema@api-payments.com',
            password: 'SenhaInterna123!',
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
          access_token: { type: 'string' },
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
