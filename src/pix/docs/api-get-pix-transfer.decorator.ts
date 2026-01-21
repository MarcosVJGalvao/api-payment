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

export function ApiGetPixTransfer() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Buscar dados de uma transferência PIX',
      description:
        'Retorna os dados detalhados de uma transferência PIX, sincronizando o status com o provedor se necessário.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'id',
      description: 'ID da transferência PIX',
      type: 'string',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Transferência encontrada com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', example: 'DONE' },
          amount: { type: 'number', example: 100.5 },
          transactionId: { type: 'string' },
          authenticationCode: { type: 'string' },
          sender: { type: 'object' },
          recipient: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
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
      description: 'Transferência não encontrada',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            RESOURCE_NOT_FOUND: {
              summary: 'Transferência não encontrada',
              value: {
                errorCode: 'RESOURCE_NOT_FOUND',
                message: 'Pix Transfer not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
