import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionResponseDto } from '../dto/transaction-response.dto';

export function ApiListTransactions() {
  return applyDecorators(
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
      status: 400,
      description: 'Parâmetros de query inválidos',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
  );
}
