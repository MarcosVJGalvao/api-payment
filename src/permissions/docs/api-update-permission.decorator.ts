import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { Permission } from '../entities/permission.entity';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiUpdatePermission() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Atualizar permissão' }),
    ApiParam({ name: 'id', description: 'ID da permissão' }),
    ApiBody({ type: UpdatePermissionDto }),
    ApiResponse({
      status: 200,
      description: 'Permissão atualizada',
      type: Permission,
    }),
    ApiResponse({
      status: 401,
      description: 'Erro de autenticação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            UNAUTHORIZED: {
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
      description: 'Permissão não encontrada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PERMISSION_NOT_FOUND: {
              value: {
                errorCode: 'PERMISSION_NOT_FOUND',
                message: 'Permission not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
