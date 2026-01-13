import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  secretAnswer: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
