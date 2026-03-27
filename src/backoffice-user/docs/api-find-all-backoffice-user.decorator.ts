import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { StatusEnum } from '@/common/enums/status.enum';
import { SortOrder } from '@/common/base-query/enums/sort-order.enum';
import { BackofficeUserSortField } from '../enums/backoffice-user-sort.enum';

export function ApiFindAllBackofficeUser() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      default: 'createdAt',
      enum: Object.values(BackofficeUserSortField),
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: SortOrder,
      default: SortOrder.DESC,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      default: 10,
    }),
    ApiOperation({
      summary: 'Listar usuários Backoffice',
      description:
        'Retorna uma lista paginada de usuários do backoffice vinculados ao cliente autenticado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuários retornada com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
                },
                name: { type: 'string', example: 'John Doe' },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'john@example.com',
                },
                status: {
                  type: 'string',
                  enum: Object.values(StatusEnum),
                  example: StatusEnum.ACTIVE,
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2023-10-27T10:00:00Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2023-10-27T10:00:00Z',
                },
                deletedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2023-10-27T10:00:00Z',
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              total: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 1 },
              hasNextPage: { type: 'boolean', example: false },
              hasPreviousPage: { type: 'boolean', example: false },
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
      status: 403,
      description: 'Permissão negada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            FORBIDDEN: {
              summary: 'Sem permissão para este recurso',
              value: {
                errorCode: 'FORBIDDEN',
                message: 'You do not have permission to access this resource',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
