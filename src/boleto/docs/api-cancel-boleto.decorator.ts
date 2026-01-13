import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CancelBoletoDto } from '../dto/cancel-boleto.dto';

export function ApiCancelBoleto() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cancelar boleto',
      description:
        'Cancela um boleto emitido no provedor financeiro especificado. O boleto não pode ser cancelado se já estiver pago ou cancelado.',
    }),
    ApiBody({
      type: CancelBoletoDto,
      examples: {
        'Cancelar Boleto': {
          summary: 'Cancelar um boleto existente',
          value: {
            authenticationCode: '5566165e-51fb-459b-a31c-1e996165280b',
            account: {
              branch: '0001',
              number: '123456',
              type: 'CHECKING',
            },
          },
        },
      },
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
