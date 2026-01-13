import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiDeleteWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remover Webhook',
      description:
        'Remove um webhook existente no provedor financeiro e marca como deletado localmente.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'id',
      description: 'ID do webhook no provedor financeiro',
      example: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
    }),
    ApiResponse({
      status: 204,
      description: 'Webhook removido com sucesso',
    }),
    ApiResponse({
      status: 404,
      description: 'Webhook não encontrado',
    }),
  );
}
