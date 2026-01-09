import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ILoginInternalUser } from '../interfaces/internal-user.interface';

export class LoginInternalUserDto implements ILoginInternalUser {
  @ApiProperty({ description: 'Nome de usuário', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Senha', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
