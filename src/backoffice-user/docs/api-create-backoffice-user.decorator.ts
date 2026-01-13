import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateBackofficeUserDto } from '../dto/create-backoffice-user.dto';

export function ApiCreateBackofficeUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new Backoffice User' }),
    ApiBody({
      type: CreateBackofficeUserDto,
      examples: {
        'Novo Usuário': {
          summary: 'Criar usuário backoffice',
          value: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'SenhaSegura123!',
            secretAnswer: 'Resposta Secreta',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          status: { type: 'string', example: 'ACTIVE' },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
  );
}
