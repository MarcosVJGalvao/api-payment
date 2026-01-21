import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiListTransactions() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Listar transações',
      description:
        'Lista transações da conta com paginação, filtros e busca. Permite filtrar por tipo, status (semântico) e status detalhado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de transações retornada com sucesso',
      type: TransactionResponseDto,
      isArray: true,
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
  );
}
