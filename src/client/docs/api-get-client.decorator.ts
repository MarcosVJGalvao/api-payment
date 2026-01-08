import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Client } from '../entities/client.entity';

export function ApiGetClient() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar cliente por ID' }),
    ApiParam({ name: 'id', description: 'ID do cliente' }),
    ApiResponse({
      status: 200,
      description: 'Cliente encontrado',
      type: Client,
    }),
    ApiResponse({
      status: 404,
      description: 'Cliente não encontrado',
    }),
  );
}
