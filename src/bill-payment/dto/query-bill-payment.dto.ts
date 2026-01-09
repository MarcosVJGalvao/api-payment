import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { BillPaymentStatus } from '../enums/bill-payment-status.enum';

export class QueryBillPaymentDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status do pagamento',
    enum: BillPaymentStatus,
  })
  @IsOptional()
  @IsEnum(BillPaymentStatus)
  status?: BillPaymentStatus;
}
