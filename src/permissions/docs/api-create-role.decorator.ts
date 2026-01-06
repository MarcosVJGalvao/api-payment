import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateRoleDto } from '../dto/create-role.dto';
import { Role } from '../entities/role.entity';

export function ApiCreateRole() {
  return applyDecorators(
    ApiOperation({ summary: 'Criar uma nova role personalizada' }),
    ApiBody({ type: CreateRoleDto }),
    ApiResponse({
      status: 201,
      description: 'Role criada com sucesso',
      type: Role,
    }),
    ApiResponse({
      status: 400,
      description: 'Erro de validação',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'INVALID_INPUT',
          },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: ['name should not be empty', 'name must be a string'],
          },
          correlationId: {
            type: 'string',
            example: 'c113416d-2180-4141-9965-c14f93046977',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Permissão negada',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'PERMISSION_DENIED',
          },
          message: {
            type: 'string',
            example: 'Permission denied.',
          },
          correlationId: {
            type: 'string',
            example: '9afe65e8-a787-4bd5-8f71-db7074117352',
          },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Role já existe',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'ROLE_ALREADY_EXISTS',
          },
          message: {
            type: 'string',
            example: 'Role already exists.',
          },
          correlationId: {
            type: 'string',
            example: '9afe65e8-a787-4bd5-8f71-db7074117352',
          },
        },
      },
    }),
  );
}
