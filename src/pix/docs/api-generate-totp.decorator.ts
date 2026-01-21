import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { GenerateTotpDto } from '../dto/generate-totp.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiGenerateTotp() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
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
      description: 'Erro de validação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_INPUT: {
              summary: 'Tipo de chave inválido',
              value: {
                errorCode: 'INVALID_INPUT',
                message:
                  'TOTP generation is only available for EMAIL and PHONE key types',
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
      status: 500,
      description: 'Erro interno',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            PIX_TOTP_GENERATION_FAILED: {
              summary: 'Falha ao gerar código TOTP',
              value: {
                errorCode: 'PIX_TOTP_GENERATION_FAILED',
                message: 'Failed to generate TOTP code',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
