import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

export function ApiUpdateBoleto() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Atualizar boleto',
      description:
        'Atualiza informações de um boleto (status, código de autenticação, código de barras, linha digitável).',
    }),
    ApiParam({
      name: 'id',
      description: 'ID do boleto',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Boleto atualizado com sucesso',
    }),
    ApiResponse({
      status: 404,
      description: 'Boleto não encontrado',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 404,
      description: 'Boleto não encontrado',
    }),
  );
}
