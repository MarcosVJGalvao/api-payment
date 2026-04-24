import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

export class UpdateWebhookConfigurationDto {
  @ApiPropertyOptional({
    description: 'Nova URL de destino (HTTPS)',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false, protocols: ['https'] })
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional({
    description: 'Novo tipo de evento a ser assinado',
    enum: ApiPaymentWebhookEventType,
  })
  @IsOptional()
  @IsEnum(ApiPaymentWebhookEventType)
  eventType?: ApiPaymentWebhookEventType;

  @ApiPropertyOptional({ description: 'Nova chave pública', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  publicKey?: string;

  @ApiPropertyOptional({
    description: 'Novo segredo HMAC. Retornado apenas nesta operação.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  @MaxLength(255)
  privateKey?: string;
}
