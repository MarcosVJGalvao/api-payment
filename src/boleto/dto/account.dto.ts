import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { IAccount } from '../interfaces/account.interface';

export class AccountDto implements IAccount {
  @ApiProperty({ description: 'Número da conta', example: '1104835921' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  number: string;

  @ApiProperty({ description: 'Número da agência', example: '0001' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  branch: string;
}
