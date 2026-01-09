import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BackofficeLoginDto {
  @ApiProperty({
    example: 'admin@empresa.com',
    description: 'Email do usuário backoffice',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Senha123@',
    description: 'Senha do usuário backoffice',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
