import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { TedTransferStatus } from '../enums/ted-transfer-status.enum';

export function ApiGetTedTransfer() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Buscar detalhes de uma transferência TED',
      description:
        'Retorna os detalhes completos de uma transferência TED específica, ' +
        'incluindo informações do remetente, destinatário e status atualizado.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'id',
      description: 'ID único da transferência TED (UUID)',
      example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      type: String,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Detalhes da transferência TED retornados com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          },
          authenticationCode: { type: 'string', example: 'ABC123DEF456GHI789' },
          correlationId: { type: 'string', nullable: true },
          idempotencyKey: { type: 'string', nullable: true },
          status: { type: 'string', example: TedTransferStatus.DONE },
          amount: { type: 'number', example: 1500.0 },
          currency: { type: 'string', example: 'BRL' },
          description: { type: 'string', nullable: true },
          sender: { type: 'object' },
          recipient: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
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
      status: HttpStatus.NOT_FOUND,
      description: 'Transferência TED não encontrada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            RESOURCE_NOT_FOUND: {
              summary: 'Transferência não encontrada',
              value: {
                errorCode: 'RESOURCE_NOT_FOUND',
                message: 'TED Transfer not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
