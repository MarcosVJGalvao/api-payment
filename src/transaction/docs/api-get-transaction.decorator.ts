import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiGetTransaction() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Obter detalhes de uma transação',
      description:
        'Retorna os detalhes de uma transação específica. A transação deve pertencer à conta autenticada.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID da transação',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Detalhes da transação retornados com sucesso',
      type: TransactionResponseDto,
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
      description: 'Transação não encontrada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            TRANSACTION_NOT_FOUND: {
              summary: 'Transação não encontrada',
              value: {
                errorCode: 'TRANSACTION_NOT_FOUND',
                message: 'Transaction not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
