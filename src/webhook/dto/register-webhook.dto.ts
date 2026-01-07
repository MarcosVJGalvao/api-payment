import { IsEnum, IsNotEmpty, IsString, IsUrl, MaxLength, Validate } from 'class-validator';
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
}
