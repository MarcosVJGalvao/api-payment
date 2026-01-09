import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ICancelBoleto } from '../interfaces/cancel-boleto.interface';
import { AccountDto } from './account.dto';

export class CancelBoletoDto implements ICancelBoleto {
  @ApiProperty({
    description: 'Código de autenticação do boleto a ser cancelado',
    example: '5566165e-51fb-459b-a31c-1e996165280b',
  })
  @IsString()
  @IsNotEmpty()
  authenticationCode: string;

  @ApiProperty({
    description: 'Dados da conta associada ao boleto',
    type: AccountDto,
  })
  @ValidateNested()
  @Type(() => AccountDto)
  account: AccountDto;
}
