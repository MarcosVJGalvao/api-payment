import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginInternalUserDto } from '../dto/login-internal-user.dto';

export function ApiLoginInternalUser() {
  return applyDecorators(
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
    }),
  );
}
