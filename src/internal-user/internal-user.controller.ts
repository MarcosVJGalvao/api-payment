import { Controller, Post, Body } from '@nestjs/common';
import { InternalAuthService } from './services/internal-auth.service';
import { LoginInternalUserDto } from './dto/login-internal-user.dto';
import { ApiLoginInternalUser } from './docs/api-login-internal-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiControllerHideFromPortalScalar } from '@/swagger/docs/api-controller-hide-from-portal-scalar.decorator';

@ApiControllerHideFromPortalScalar('Usuários Internos')
@Controller('internal-users')
@ApiBearerAuth('internal-auth')
export class InternalUserController {
  constructor(private readonly authService: InternalAuthService) {}

  @Post('login')
  @ApiLoginInternalUser()
  async login(@Body() loginDto: LoginInternalUserDto) {
    return this.authService.login(loginDto);
  }
}
