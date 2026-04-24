import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

export class CreateWebhookConfigurationDto {
  @ApiProperty({
    description: 'Tipo de evento interno da api-payment que este webhook irá receber',
    enum: ApiPaymentWebhookEventType,
    example: ApiPaymentWebhookEventType.PIX_CASH_OUT_COMPLETED,
  })
  @IsEnum(ApiPaymentWebhookEventType)
  @IsNotEmpty()
  eventType!: ApiPaymentWebhookEventType;

  @ApiProperty({
    description: 'URL HTTPS de destino para receber os eventos',
    example: 'https://cliente.com.br/webhooks/api-payment',
    maxLength: 500,
  })
  @IsUrl({ require_protocol: true, require_tld: false, protocols: ['https'] })
  @IsNotEmpty()
  @MaxLength(500)
  url!: string;

  @ApiPropertyOptional({
    description:
      'Chave pública usada no header Authorization e na string assinada. Gerada automaticamente se não informada.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  publicKey?: string;

  @ApiPropertyOptional({
    description:
      'Segredo HMAC usado para assinar o payload. Gerado automaticamente se não informado. Retornado apenas na criação.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  @MaxLength(255)
  privateKey?: string;
}
