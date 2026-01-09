import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';

export function ApiUpdateWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Atualizar Webhook',
      description:
        'Atualiza a configuração de um webhook existente no provedor financeiro. Atualmente suporta apenas a alteração da URI.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Slug do provedor financeiro (ex: hiperbanco)',
      example: 'hiperbanco',
    }),
    ApiParam({
      name: 'id',
      description: 'ID do webhook no provedor financeiro',
      example: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
    }),
    ApiBody({
      type: UpdateWebhookDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Webhook atualizado com sucesso',
      schema: {
        example: {
          id: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
          name: 'SANDBOX_BOLETO_CASH_IN_WAS_RECEIVED',
          context: 'Boleto',
          eventName: 'BOLETO_CASH_IN_WAS_RECEIVED',
          uri: 'https://meuwebhook.com/123',
          publicKey: '872dc2ed-8bee-40b5-8465-5d2953ba76dp',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos ou provedor não suportado',
    }),
  );
}
