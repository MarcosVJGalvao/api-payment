import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

export function ApiListClients() {
  return applyDecorators(
    ApiOperation({ summary: 'Listar clientes com paginação e filtros' }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de clientes',
    }),
  );
}
