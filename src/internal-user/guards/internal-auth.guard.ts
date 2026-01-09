import { Injectable, ExecutionContext, HttpStatus, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InternalJwtService } from '../services/internal-jwt.service';
import { InternalAuthService } from '../services/internal-auth.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

export interface AuthenticatedInternalUserRequest {
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
  };
  headers: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
  [key: string]: unknown;
}

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: InternalJwtService,
    private readonly authService: InternalAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedInternalUserRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomHttpException(
        'Authorization header missing or invalid',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    const payload = this.jwtService.verifyToken(token);

    if (!payload || payload.type !== 'internal') {
      throw new CustomHttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_SESSION,
      );
    }

    const user = await this.authService.validateUser(payload.userId);

    if (!user) {
      throw new CustomHttpException(
        'User not found',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.USER_NOT_FOUND,
      );
    }

    request.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    };

    return true;
  }
}
