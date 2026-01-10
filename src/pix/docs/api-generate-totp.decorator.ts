import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { GenerateTotpDto } from '../dto/generate-totp.dto';

export function ApiGenerateTotp() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Gerar código TOTP',
      description:
        'Gera e envia um código TOTP de 6 dígitos para validação de chave PIX. ' +
        'O código será enviado por SMS (PHONE) ou email (EMAIL). ' +
        'Obrigatório antes do cadastro de chaves EMAIL ou PHONE.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro (ex: hiperbanco)',
      example: 'hiperbanco',
    }),
    ApiBody({ type: GenerateTotpDto }),
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
