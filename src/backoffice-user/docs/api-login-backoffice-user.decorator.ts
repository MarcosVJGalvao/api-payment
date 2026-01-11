import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginBackofficeUserDto } from '../dto/login-backoffice-user.dto';

export function ApiLoginBackofficeUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Authenticate Backoffice User' }),
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
      description: 'Login successful',
      schema: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            example: 'jwt.token.here',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials',
    }),
  );
}
