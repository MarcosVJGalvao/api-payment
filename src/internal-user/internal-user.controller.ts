import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InternalAuthService } from './services/internal-auth.service';
import { LoginInternalUserDto } from './dto/login-internal-user.dto';

@ApiTags('Usuários Internos')
@Controller('internal-users')
export class InternalUserController {
  constructor(
    private readonly authService: InternalAuthService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login de usuário interno' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(@Body() loginDto: LoginInternalUserDto) {
    return this.authService.login(loginDto);
  }
}
