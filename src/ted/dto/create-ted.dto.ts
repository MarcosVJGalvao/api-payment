import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TedRecipientDto } from './ted-recipient.dto';

export class CreateTedDto {
  @ApiProperty({
    description: 'Valor da transferência',
    example: 1500.0,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Descrição da transferência (max 140 chars)',
    example: 'Pagamento de fornecedor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @ApiPropertyOptional({
    description: 'Chave de idempotência (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiProperty({
    description: 'Dados do destinatário',
    type: TedRecipientDto,
  })
  @ValidateNested()
  @Type(() => TedRecipientDto)
  @IsNotEmpty()
  recipient: TedRecipientDto;
}
