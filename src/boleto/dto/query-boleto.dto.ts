import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { BoletoStatus } from '../enums/boleto-status.enum';
import { BoletoType } from '../enums/boleto-type.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export class QueryBoletoDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: BoletoStatus,
    description: 'Filtrar por status do boleto',
  })
  @IsOptional()
  @IsEnum(BoletoStatus)
  status?: BoletoStatus;

  @ApiPropertyOptional({
    enum: BoletoType,
    description: 'Filtrar por tipo de boleto',
  })
  @IsOptional()
  @IsEnum(BoletoType)
  type?: BoletoType;

  @ApiPropertyOptional({
    enum: FinancialProvider,
    description: 'Filtrar por provedor financeiro',
  })
  @IsOptional()
  @IsEnum(FinancialProvider)
  providerSlug?: FinancialProvider;
}
