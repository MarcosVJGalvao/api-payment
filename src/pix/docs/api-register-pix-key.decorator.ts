import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { RegisterPixKeyDto } from '../dto/register-pix-key.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiRegisterPixKey() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
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
          value: { type: 'CPF', value: '47742663023' },
        },
        'Chave CNPJ': {
          summary: 'Cadastro de chave CNPJ',
          value: { type: 'CNPJ', value: '12345678000190' },
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
          value: { type: 'PHONE', value: '+5511999887766', totpCode: '654321' },
        },
        'Chave Aleatória (EVP)': {
          summary: 'Cadastro de chave aleatória - não requer value',
          value: { type: 'EVP' },
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
      description: 'Erro de validação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PIX_TOTP_REQUIRED: {
              summary: 'TOTP Obrigatório',
              value: {
                errorCode: 'PIX_TOTP_REQUIRED',
                message: 'TOTP code is required for EMAIL and PHONE key types',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Erro de autenticação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            UNAUTHORIZED: {
              summary: 'Token inválido ou expirado',
              value: {
                errorCode: 'UNAUTHORIZED',
                message: 'Token de autenticação inválido ou expirado',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Recurso não encontrado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            ACCOUNT_NOT_FOUND: {
              summary: 'Conta não encontrada',
              value: {
                errorCode: 'ACCOUNT_NOT_FOUND',
                message: 'Account not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PIX_KEY_REGISTRATION_FAILED: {
              summary: 'Falha ao registrar chave PIX',
              value: {
                errorCode: 'PIX_KEY_REGISTRATION_FAILED',
                message: 'Failed to register PIX key',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
