import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateClientDto } from '../dto/create-client.dto';
import { Client } from '../entities/client.entity';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiCreateClient() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Criar um novo cliente' }),
    ApiBody({
      type: CreateClientDto,
      examples: {
        'Cliente PJ': {
          summary: 'Criar cliente pessoa jurídica',
          value: {
            name: 'Empresa XYZ Ltda',
            document: '12345678000199',
            scopes: ['financial:boleto', 'financial:pix', 'auth:bank'],
          },
        },
        'Cliente PF': {
          summary: 'Criar cliente pessoa física',
          value: {
            name: 'João da Silva',
            document: '12345678901',
            scopes: ['financial:pix'],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Cliente criado com sucesso',
      type: Client,
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
      description: 'Cliente já existe',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            CLIENT_ALREADY_EXISTS: {
              summary: 'Cliente com documento já existe',
              value: {
                errorCode: 'CLIENT_ALREADY_EXISTS',
                message: 'Client with this document already exists',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
