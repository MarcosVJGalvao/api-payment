import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiGetBoleto() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Consultar boleto por ID',
      description: 'Retorna os dados completos de um boleto pelo seu ID.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID do boleto',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Boleto encontrado',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          alias: { type: 'string' },
          type: { type: 'string', example: 'Deposit' },
          status: { type: 'string', example: 'REGISTERED' },
          amount: { type: 'number' },
          dueDate: { type: 'string', format: 'date' },
          authenticationCode: { type: 'string' },
          barcode: { type: 'string' },
          digitable: { type: 'string' },
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
      status: 403,
      description: 'Acesso negado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            ACCESS_DENIED: {
              summary: 'Boleto não pertence à conta',
              value: {
                errorCode: 'ACCESS_DENIED',
                message: 'Boleto does not belong to this account',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Boleto não encontrado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            BOLETO_NOT_FOUND: {
              summary: 'Boleto não encontrado',
              value: {
                errorCode: 'BOLETO_NOT_FOUND',
                message: 'Boleto not found',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
