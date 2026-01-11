import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InternalAuthService } from './services/internal-auth.service';
import { LoginInternalUserDto } from './dto/login-internal-user.dto';
import { ApiLoginInternalUser } from './docs/api-login-internal-user.decorator';

@ApiTags('Usuários Internos')
@Controller('internal-users')
export class InternalUserController {
  constructor(private readonly authService: InternalAuthService) {}

  @Post('login')
  @ApiLoginInternalUser()
  async login(@Body() loginDto: LoginInternalUserDto) {
    return this.authService.login(loginDto);
  }
}
