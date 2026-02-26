import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BackofficeAuthService } from './services/backoffice-auth.service';
import { LoginBackofficeUserDto } from './dto/login-backoffice-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/auth/decorators/public.decorator';
import { ApiLoginBackofficeUser } from './docs/api-login-backoffice-user.decorator';
import { ApiResetPassword } from './docs/api-reset-password.decorator';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

@ApiTags('Backoffice Auth')
@Controller('backoffice/auth')
export class BackofficeAuthController {
  constructor(private readonly authService: BackofficeAuthService) {}

  private requireClientId(clientIdHeader?: string): string {
    if (!clientIdHeader) {
      throw new CustomHttpException(
        'X-Client-Id header is required',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }

    return clientIdHeader;
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiLoginBackofficeUser()
  async login(
    @Body() dto: LoginBackofficeUserDto,
    @Headers('x-client-id') clientIdHeader?: string,
  ) {
    return this.authService.login(dto, this.requireClientId(clientIdHeader));
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResetPassword()
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Headers('x-client-id') clientIdHeader?: string,
  ) {
    return this.authService.resetPassword(
      dto,
      this.requireClientId(clientIdHeader),
    );
  }
}
