import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpdateClientDto } from '../dto/update-client.dto';
import { Client } from '../entities/client.entity';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiUpdateClient() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Atualizar cliente' }),
    ApiParam({ name: 'id', description: 'ID do cliente' }),
    ApiBody({
      type: UpdateClientDto,
      examples: {
        'Atualizar Nome': {
          summary: 'Atualizar nome do cliente',
          value: { name: 'Empresa ABC Ltda' },
        },
        'Atualizar Scopes': {
          summary: 'Atualizar permissões do cliente',
          value: {
            scopes: [
              'financial:boleto',
              'financial:pix',
              'integration:webhook',
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cliente atualizado com sucesso',
      type: Client,
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
      description: 'Cliente não encontrado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            CLIENT_NOT_FOUND: {
              summary: 'Cliente não encontrado',
              value: {
                errorCode: 'CLIENT_NOT_FOUND',
                message: 'Client not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
