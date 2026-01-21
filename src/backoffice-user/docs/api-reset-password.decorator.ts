import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

export function ApiResetPassword() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiOperation({ summary: 'Resetar senha usando resposta secreta' }),
    ApiBody({
      type: ResetPasswordDto,
      examples: {
        'Reset de Senha': {
          summary: 'Resetar senha usando resposta secreta',
          value: {
            email: 'admin@empresa.com.br',
            secretAnswer: 'Resposta Secreta',
            newPassword: 'NovaSenhaSegura456!',
          },
        },
      },
    }),
    ApiResponse({
      status: 204,
      description: 'Senha resetada com sucesso',
    }),
    ApiResponse({
      status: 400,
      description: 'Erro de validação',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            VALIDATION_ERROR: {
              summary: 'Dados inválidos',
              value: {
                errorCode: 'VALIDATION_ERROR',
                message: 'Validation failed',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Resposta secreta inválida',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: {
            INVALID_SECRET_ANSWER: {
              summary: 'Resposta secreta inválida',
              value: {
                errorCode: 'INVALID_SECRET_ANSWER',
                message: 'Invalid secret answer',
                correlationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
            },
          },
        },
      },
    }),
  );
}
