import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWebhookDto {
    @ApiProperty({
        description: 'Nova URL para onde os webhooks serão enviados.',
        example: 'https://meuwebhook.com/123',
    })
    @IsString()
    @IsNotEmpty()
    @IsUrl({ require_tld: false })
    uri: string;
}
