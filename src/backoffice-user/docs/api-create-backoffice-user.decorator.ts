import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateBackofficeUserDto } from '../dto/create-backoffice-user.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiCreateBackofficeUser() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Criar novo usuário Backoffice' }),
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
      description: 'Usuário criado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string' },
          status: { type: 'string', example: 'ACTIVE' },
          createdAt: { type: 'string', format: 'date-time' },
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
    ApiResponse({
      status: 409,
      description: 'Usuário já existe',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            USER_ALREADY_EXISTS: {
              summary: 'Email já cadastrado',
              value: {
                errorCode: 'USER_ALREADY_EXISTS',
                message: 'User with this email already exists',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
