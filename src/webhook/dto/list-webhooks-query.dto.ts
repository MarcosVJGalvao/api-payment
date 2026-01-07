import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum WebhookStatus {
    ENABLED = 'Enabled',
    DISABLED = 'Disabled',
}

export class ListWebhooksQueryDto {
    @ApiPropertyOptional({
        description: 'Status das configurações',
        enum: WebhookStatus,
        example: WebhookStatus.ENABLED,
    })
    @IsOptional()
    @IsEnum(WebhookStatus)
    status?: WebhookStatus;

    @ApiPropertyOptional({
        description: 'Número da página a ser exibida',
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Número de resultados por página',
        minimum: 1,
        maximum: 100,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 10;
}
