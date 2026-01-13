import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RegisterPixKeyDto } from '../dto/register-pix-key.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiRegisterPixKey() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastrar chave PIX',
      description:
        'Registra uma nova chave PIX para a conta do usuário. ' +
        'Para chaves do tipo EMAIL e PHONE, é necessário gerar um código TOTP antes via endpoint /totp. ' +
        'Limite: Pessoa Física até 5 chaves, Pessoa Jurídica até 20 chaves por conta.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: RegisterPixKeyDto,
      examples: {
        'Chave CPF': {
          summary: 'Cadastro de chave CPF',
          value: {
            type: 'CPF',
            value: '47742663023',
          },
        },
        'Chave CNPJ': {
          summary: 'Cadastro de chave CNPJ',
          value: {
            type: 'CNPJ',
            value: '12345678000190',
          },
        },
        'Chave EMAIL (requer TOTP)': {
          summary: 'Cadastro de chave Email - requer código TOTP',
          value: {
            type: 'EMAIL',
            value: 'exemplo@email.com',
            totpCode: '312210',
          },
        },
        'Chave PHONE (requer TOTP)': {
          summary: 'Cadastro de chave Telefone - requer código TOTP',
          value: {
            type: 'PHONE',
            value: '+5511999887766',
            totpCode: '654321',
          },
        },
        'Chave Aleatória (EVP)': {
          summary: 'Cadastro de chave aleatória - não requer value',
          value: {
            type: 'EVP',
          },
        },
      },
    }),
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
