import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { RegisterPixKeyDto } from '../dto/register-pix-key.dto';

export function ApiRegisterPixKey() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Cadastrar chave PIX',
      description:
        'Registra uma nova chave PIX para a conta do usuário. ' +
        'Para chaves do tipo EMAIL e PHONE, é necessário gerar um código TOTP antes via endpoint /totp. ' +
        'Limite: Pessoa Física até 5 chaves, Pessoa Jurídica até 20 chaves por conta.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro (ex: hiperbanco)',
      example: 'hiperbanco',
    }),
    ApiBody({ type: RegisterPixKeyDto }),
    ApiResponse({
      status: 201,
      description: 'Chave PIX cadastrada com sucesso',
      schema: {
        type: 'object',
        properties: {
          addressingKey: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'CPF' },
              value: { type: 'string', example: '47742663023' },
            },
          },
          account: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'CHECKING' },
              branch: { type: 'string', example: '0001' },
              number: { type: 'string', example: '15164' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos ou TOTP obrigatório não informado',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
  );
}
