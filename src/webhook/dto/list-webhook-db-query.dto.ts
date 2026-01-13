import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { WebhookContext } from '../enums/webhook-context.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export class ListWebhookDbQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Slug do provedor',
    enum: FinancialProvider,
  })
  @IsOptional()
  @IsEnum(FinancialProvider)
  provider?: FinancialProvider;

  @ApiPropertyOptional({
    description: 'Contexto do webhook',
    enum: WebhookContext,
  })
  @IsOptional()
  @IsEnum(WebhookContext)
  context?: WebhookContext;

  @ApiPropertyOptional({
    description: 'Nome do evento',
  })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional({
    description: 'Status do webhook',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}
