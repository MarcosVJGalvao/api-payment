import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiDeletePixKey() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Excluir chave PIX',
      description:
        'Remove uma chave PIX vinculada à conta do usuário. ' +
        'O valor da chave deve ser informado no path (ex: CPF, email, telefone, EVP).',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro (ex: hiperbanco)',
      example: 'hiperbanco',
    }),
    ApiParam({
      name: 'addressKey',
      description:
        'Valor da chave PIX a ser excluída (CPF, CNPJ, email, telefone ou EVP)',
      example: '47742663023',
    }),
    ApiResponse({
      status: 204,
      description: 'Chave PIX excluída com sucesso',
    }),
    ApiResponse({
      status: 400,
      description: 'Chave não encontrada ou não pertence à conta',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
  );
}
