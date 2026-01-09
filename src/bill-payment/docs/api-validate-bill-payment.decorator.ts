import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiValidateBillPayment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Validar título para pagamento',
      description:
        'Valida um título pela linha digitável e retorna os dados para confirmação do pagamento. ' +
        'Esta é a primeira etapa do processo de pagamento de conta.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro (ex: hiperbanco)',
      example: 'hiperbanco',
    }),
    ApiParam({
      name: 'digitable',
      description: 'Linha digitável do título (código de barras numérico)',
      example: '34191090080025732445903616490003691150000020000',
    }),
    ApiResponse({
      status: 200,
      description: 'Título validado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'b985967b-a0ed-4810-addd-ec100b128171',
          },
          assignor: { type: 'string', example: 'BANCO ITAU S.A.' },
          recipient: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'BENEFICIARIO AMBIENTE HOMOLOGACAO',
              },
              documentNumber: { type: 'string', example: '87.754.347/0001-08' },
            },
          },
          payer: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'PAGADOR AMBIENTE DE HOMOLOGACAO',
              },
              documentNumber: { type: 'string', example: '698.447.801-44' },
            },
          },
          dueDate: { type: 'string', example: '2025-09-20T00:00:00' },
          originalAmount: { type: 'number', example: 200 },
          amount: { type: 'number', example: 200 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Falha na validação do título',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
  );
}
