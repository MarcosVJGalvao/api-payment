import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiGetPixTransfer() {
  return applyDecorators(
    ApiOperation({
      summary: 'Buscar dados de uma transferência PIX',
      description:
        'Retorna os dados detalhados de uma transferência PIX, sincronizando o status com o provedor se necessário.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID da transferência PIX',
      type: 'string',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Transferência encontrada com sucesso',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Transferência não encontrada',
    }),
  );
}
