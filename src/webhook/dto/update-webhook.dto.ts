import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWebhookDto {
  @ApiProperty({
    description: 'Nova URL para onde os webhooks serão enviados.',
    example: 'https://meuwebhook.com/123',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  uri: string;

  @ApiPropertyOptional({
    description:
      'URL de callback para receber notificação de sucesso de cadastro do webhook',
    example: 'https://integrador.com/webhooks/registration-success',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false, protocols: ['https'] })
  @MaxLength(500)
  registrationCallbackUri?: string;

  @ApiPropertyOptional({
    description: 'Segredo para assinatura HMAC do webhook de sucesso de cadastro',
    example: 'secret_very_strong_key_123',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  registrationCallbackSecret?: string;
}
