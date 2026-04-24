import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';

export class QueryWebhookMessageDto {
  @ApiPropertyOptional({ description: 'Filtrar por status', enum: OutboundWebhookMessageStatus })
  @IsOptional()
  @IsEnum(OutboundWebhookMessageStatus)
  status?: OutboundWebhookMessageStatus;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de evento', enum: ApiPaymentWebhookEventType })
  @IsOptional()
  @IsEnum(ApiPaymentWebhookEventType)
  eventType?: ApiPaymentWebhookEventType;

  @ApiPropertyOptional({ description: 'Filtrar por configuração de webhook' })
  @IsOptional()
  @IsUUID()
  configurationId?: string;

  @ApiPropertyOptional({ description: 'Data inicial (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO 8601)', example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Número da página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página (máx 100)', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number;
}
