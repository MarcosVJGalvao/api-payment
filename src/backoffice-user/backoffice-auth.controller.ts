import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BackofficeAuthService } from './services/backoffice-auth.service';
import { LoginBackofficeUserDto } from './dto/login-backoffice-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/auth/decorators/public.decorator';
import { ApiLoginBackofficeUser } from './docs/api-login-backoffice-user.decorator';
import { ApiResetPassword } from './docs/api-reset-password.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Backoffice Auth')
@Controller('backoffice/auth')
@ApiBearerAuth('backoffice-auth')
export class BackofficeAuthController {
  constructor(private readonly authService: BackofficeAuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiLoginBackofficeUser()
  async login(@Body() dto: LoginBackofficeUserDto) {
    return this.authService.login(dto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResetPassword()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
