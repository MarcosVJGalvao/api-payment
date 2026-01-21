import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionResponseDto } from '../dto/transaction-response.dto';

export function ApiGetTransaction() {
  return applyDecorators(
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
      status: 404,
      description: 'Transação não encontrada ou não pertence à conta',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
  );
}
