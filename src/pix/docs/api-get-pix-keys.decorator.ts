import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiGetPixKeys() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Consultar chaves PIX',
      description:
        'Retorna a lista de chaves PIX vinculadas à conta do usuário autenticado.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro (ex: hiperbanco)',
      example: 'hiperbanco',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de chaves PIX retornada com sucesso',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              example: 'EMAIL',
              description: 'Tipo da chave (CPF, CNPJ, EMAIL, PHONE, EVP)',
            },
            value: {
              type: 'string',
              example: 'carlos.neto@hiperbanco.com.br',
              description: 'Valor da chave',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
  );
}
