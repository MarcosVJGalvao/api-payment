import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackofficeUserService } from '../services/backoffice-user.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class BackofficeJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-backoffice',
) {
  constructor(
    configService: ConfigService,
    private readonly userService: BackofficeUserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'secretKey'),
    });
  }

  async validate(payload: JwtPayload) {
    // payload: { sub: userId, email, clientId }
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new CustomHttpException(
        'User not found or unauthorized',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }
    // Return user object attached to Request
    return { ...user, clientId: payload.clientId };
  }
}
