import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiCancelBoleto() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({
      summary: 'Cancelar boleto',
      description:
        'Cancela um boleto pelo seu ID interno. O provider e os identificadores externos sao resolvidos a partir do registro salvo no banco. ' +
        'O boleto nao pode ser cancelado se ja estiver pago ou cancelado. Requer autenticacao `provider-auth`, `X-Client-Id` e contexto de conta.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID interno do boleto',
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
      description: 'Sessao invalida',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_SESSION: {
              summary: 'Sessao invalida',
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
      description: 'Erro de autenticacao',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            UNAUTHORIZED: {
              summary: 'Token invalido ou expirado',
              value: {
                errorCode: 'UNAUTHORIZED',
                message: 'Token de autenticacao invalido ou expirado',
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
              summary: 'Boleto nao pertence a conta',
              value: {
                errorCode: 'ACCESS_DENIED',
                message: 'Boleto does not belong to this account',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
            INVALID_SESSION: {
              summary: 'Sessao autenticada em outro provider',
              value: {
                errorCode: 'INVALID_SESSION',
                message: 'Authenticated session belongs to a different provider',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Boleto nao encontrado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            BOLETO_NOT_FOUND: {
              summary: 'Boleto nao encontrado',
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
      description: 'Boleto nao pode ser cancelado',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            BOLETO_CANNOT_BE_CANCELLED: {
              summary: 'Boleto ja esta pago ou cancelado',
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
