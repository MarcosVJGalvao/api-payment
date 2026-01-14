import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCancelBoleto() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cancelar boleto',
      description:
        'Cancela um boleto emitido no provedor financeiro especificado. O boleto não pode ser cancelado se já estiver pago ou cancelado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Boleto cancelado com sucesso.',
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos ou sessão inválida',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 403,
      description: 'Boleto não pertence à conta',
    }),
    ApiResponse({
      status: 404,
      description: 'Boleto não encontrado',
    }),
    ApiResponse({
      status: 422,
      description: 'Boleto não pode ser cancelado (já está pago ou cancelado)',
    }),
    ApiResponse({
      status: 502,
      description: 'Erro na comunicação com o provedor financeiro',
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno do servidor',
    }),
  );
}
