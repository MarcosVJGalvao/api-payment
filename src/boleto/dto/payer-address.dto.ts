import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';

export class PayerAddressDto {
  @ApiProperty({ description: 'CEP do endereço', example: '76801180' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'CEP deve conter 8 dígitos' })
  zipCode: string;

  @ApiProperty({
    description: 'Logradouro',
    example: 'Rua Major Amarante',
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 60)
  addressLine: string;

  @ApiProperty({ description: 'Bairro', example: 'Arigolândia', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 40)
  neighborhood: string;

  @ApiProperty({ description: 'Cidade', example: 'Porto Velho', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 40)
  city: string;

  @ApiProperty({ description: 'Estado (formato ISO 3166-2:BR)', example: 'RO' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  state: string;
}
