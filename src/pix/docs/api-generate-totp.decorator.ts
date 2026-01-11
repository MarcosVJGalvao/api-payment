import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GenerateTotpDto } from '../dto/generate-totp.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiGenerateTotp() {
  return applyDecorators(
    ApiOperation({
      summary: 'Gerar código TOTP',
      description:
        'Gera e envia um código TOTP de 6 dígitos para validação de chave PIX. ' +
        'O código será enviado por SMS (PHONE) ou email (EMAIL). ' +
        'Obrigatório antes do cadastro de chaves EMAIL ou PHONE.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: GenerateTotpDto,
      examples: {
        'TOTP para Email (Cadastro)': {
          summary: 'Gerar código para cadastro de chave Email',
          value: {
            operation: 'RegisterEntry',
            type: 'EMAIL',
            value: 'exemplo@email.com',
          },
        },
        'TOTP para Telefone (Cadastro)': {
          summary: 'Gerar código para cadastro de chave Telefone',
          value: {
            operation: 'RegisterEntry',
            type: 'PHONE',
            value: '+5511999887766',
          },
        },
        'TOTP para Portabilidade': {
          summary: 'Gerar código para portabilidade - requer pixKeyClaimId',
          value: {
            operation: 'Portability',
            type: 'EMAIL',
            value: 'exemplo@email.com',
            pixKeyClaimId: 'a5104f29-33a8-47e1-9c22-d1234567890a',
          },
        },
      },
    }),
    ApiResponse({
      status: 204,
      description: 'Código TOTP gerado e enviado com sucesso',
    }),
    ApiResponse({
      status: 400,
      description: 'Tipo de chave inválido (apenas EMAIL e PHONE)',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
  );
}
