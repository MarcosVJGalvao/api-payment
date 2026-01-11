import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from '../dto/reset-password.dto';

export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset Password using Secret Answer' }),
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
      description: 'Password reset successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid secret answer',
    }),
  );
}
