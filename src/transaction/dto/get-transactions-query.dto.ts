import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionSemanticStatus } from '../enums/transaction-semantic-status.enum';

export class GetTransactionsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: TransactionType,
    description: 'Filtrar por tipo de transação',
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({
    enum: TransactionSemanticStatus,
    description: 'Status simplificado da transação',
  })
  @IsOptional()
  @IsEnum(TransactionSemanticStatus)
  status?: TransactionSemanticStatus;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    description: 'Status detalhado/original da transação',
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  detailedStatus?: TransactionStatus;
}
