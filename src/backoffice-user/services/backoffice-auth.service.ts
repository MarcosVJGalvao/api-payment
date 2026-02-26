import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BackofficeUserService } from './backoffice-user.service';
import { LoginBackofficeUserDto } from '@/backoffice-user/dto/login-backoffice-user.dto';
import { ResetPasswordDto } from '@/backoffice-user/dto/reset-password.dto';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { compareData } from '@/common/helpers/password.helper';
import { StatusEnum } from '@/common/enums/status.enum';

@Injectable()
export class BackofficeAuthService {
  constructor(
    private readonly userService: BackofficeUserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginBackofficeUserDto, clientId: string) {
    const user = await this.userService.findByEmailAndClientId(dto.email, clientId);
    if (!user) {
      throw new CustomHttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    if (user.status !== StatusEnum.ACTIVE) {
      throw new CustomHttpException(
        'User is inactive',
        HttpStatus.FORBIDDEN,
        ErrorCode.USER_INACTIVE,
      );
    }

    const isPasswordValid = await compareData(
      String(dto.password),
      user.password,
    );
    if (!isPasswordValid) {
      throw new CustomHttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      clientId: user.clientId,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async resetPassword(dto: ResetPasswordDto, clientId: string) {
    const user = await this.userService.findByEmailAndClientId(dto.email, clientId);
    if (!user) {
      return;
    }

    const isAnswerValid = await compareData(
      String(dto.secretAnswer).toLowerCase(),
      user.secretAnswer,
    );
    if (!isAnswerValid) {
      throw new CustomHttpException(
        'Invalid secret answer',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    await this.userService.updatePassword(user.id, dto.newPassword);
  }
}
