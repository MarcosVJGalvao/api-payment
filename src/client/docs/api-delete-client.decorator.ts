import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteClient() {
  return applyDecorators(
    ApiOperation({ summary: 'Deletar cliente' }),
    ApiParam({ name: 'id', description: 'ID do cliente' }),
    ApiResponse({
      status: 204,
      description: 'Cliente removido com sucesso',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado',
    }),
    ApiResponse({
      status: 404,
      description: 'Cliente não encontrado',
    }),
  );
}
