import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BackofficeAuthService } from './services/backoffice-auth.service';
import { LoginBackofficeUserDto } from './dto/login-backoffice-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/auth/decorators/public.decorator';

@ApiTags('Backoffice Auth')
@Controller('backoffice/auth')
export class BackofficeAuthController {
  constructor(private readonly authService: BackofficeAuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate Backoffice User' })
  async login(@Body() dto: LoginBackofficeUserDto) {
    return this.authService.login(dto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset Password using Secret Answer' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
