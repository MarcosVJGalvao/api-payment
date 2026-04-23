import {
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WebhookContext } from '../enums/webhook-context.enum';
import { NotEqualConstraint } from '@/common/validators/not-equal.constraint';

export class RegisterWebhookDto {
  @ApiProperty({
    description: 'Nome do webhook (identificador único)',
    example: 'SANDBOX_BOLETO_CASH_IN',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Validate(NotEqualConstraint, ['eventName'], {
    message: 'Name cannot be the same as EventName',
  })
  name: string;

  @ApiProperty({
    description: 'Contexto do evento (tipo de operação)',
    example: WebhookContext.BOLETO,
    enum: WebhookContext,
  })
  @IsEnum(WebhookContext)
  @IsNotEmpty()
  context: WebhookContext;

  @ApiProperty({
    description: 'URL de callback para receber os eventos (HTTPS obrigatório)',
    example: 'https://meuwebhook.com/callback',
    maxLength: 500,
  })
  @IsUrl({ require_protocol: true, require_tld: false, protocols: ['https'] })
  @IsNotEmpty()
  @MaxLength(500)
  uri: string;

  @ApiProperty({
    description: 'Nome do evento a ser assinado',
    example: 'BOLETO_CASH_IN_WAS_RECEIVED',
  })
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ApiProperty({
    description:
      'URL de callback para receber notificação de sucesso de cadastro do webhook',
    example: 'https://integrador.com/webhooks/registration-success',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false, protocols: ['https'] })
  @MaxLength(500)
  registrationCallbackUri?: string;

  @ApiProperty({
    description: 'Segredo para assinatura HMAC do webhook de sucesso de cadastro',
    example: 'secret_very_strong_key_123',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  registrationCallbackSecret?: string;
}
