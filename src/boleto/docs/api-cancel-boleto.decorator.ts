import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiCancelBoleto() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Cancelar boleto',
      description:
        'Cancela um boleto emitido no provedor financeiro especificado. O boleto não pode ser cancelado se já estiver pago ou cancelado.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'id',
      description: 'ID do boleto',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Boleto cancelado com sucesso',
      schema: {
        type: 'object',
        properties: {
          authenticationCode: { type: 'string' },
          status: { type: 'string', example: 'CANCELLED' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Sessão inválida',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_SESSION: {
              summary: 'Sessão inválida',
              value: {
                errorCode: 'INVALID_SESSION',
                message: 'Account ID is required for boleto operations',
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
    ApiResponse({
      status: 422,
      description: 'Boleto não pode ser cancelado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            BOLETO_CANNOT_BE_CANCELLED: {
              summary: 'Boleto já está pago ou cancelado',
              value: {
                errorCode: 'BOLETO_CANNOT_BE_CANCELLED',
                message: 'Boleto cannot be cancelled with status: PAID',
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
            BOLETO_CANCEL_FAILED: {
              summary: 'Falha ao cancelar boleto',
              value: {
                errorCode: 'BOLETO_CANCEL_FAILED',
                message: 'Failed to cancel boleto in financial provider',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
