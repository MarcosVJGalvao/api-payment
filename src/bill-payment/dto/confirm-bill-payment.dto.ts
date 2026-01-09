import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IConfirmBillPayment } from '../interfaces/confirm-bill-payment.interface';

export class ConfirmBillPaymentDto implements IConfirmBillPayment {
  @ApiProperty({
    description: 'ID retornado na etapa de validação',
    example: 'b985967b-a0ed-4810-addd-ec100b128171',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Número da agência do banco do pagador',
    example: '0001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  bankBranch: string;

  @ApiProperty({
    description: 'Número da conta do pagador',
    example: '1104835921',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  bankAccount: string;

  @ApiProperty({
    description: 'Valor a ser pago',
    example: 200.0,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Descrição do pagamento',
    example: 'Pagamento de conta de luz',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
