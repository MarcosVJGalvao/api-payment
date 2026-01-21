import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO padrão para respostas de erro da API.
 * Reflete a estrutura retornada pelo HttpExceptionFilter.
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de erro específico da aplicação',
    example: 'PIX_TOTP_REQUIRED',
  })
  errorCode: string;

  @ApiProperty({
    description: 'Mensagem de erro descritiva',
    example: 'TOTP code is required for EMAIL and PHONE key types',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    description: 'ID de correlação para rastreamento',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  correlationId: string;

  @ApiProperty({
    description: 'Dados adicionais do erro (opcional)',
    required: false,
  })
  data?: Record<string, unknown>;
}
