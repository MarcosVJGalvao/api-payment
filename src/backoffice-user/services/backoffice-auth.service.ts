import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BackofficeUserService } from './backoffice-user.service';
import { LoginBackofficeUserDto } from '@/backoffice-user/dto/login-backoffice-user.dto';
import { ResetPasswordDto } from '@/backoffice-user/dto/reset-password.dto';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import * as bcrypt from 'bcrypt';
import { BackofficeUserStatus } from '../entities/backoffice-user.entity';

@Injectable()
export class BackofficeAuthService {
  constructor(
    private readonly userService: BackofficeUserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginBackofficeUserDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new CustomHttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    if (user.status !== BackofficeUserStatus.ACTIVE) {
      throw new CustomHttpException(
        'User is inactive',
        HttpStatus.FORBIDDEN,
        ErrorCode.USER_INACTIVE,
      );
    }

    const isPasswordValid = await bcrypt.compare(
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

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      // Security: Don't reveal if user exists
      return;
    }

    const isAnswerValid = await bcrypt.compare(
      String(dto.secretAnswer).toLowerCase(),
      user.secretAnswer,
    );
    if (!isAnswerValid) {
      throw new CustomHttpException(
        'Invalid secret answer',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS, // Generic error
      );
    }

    // Update password
    await this.userService.updatePassword(user.id, dto.newPassword);
  }
}
