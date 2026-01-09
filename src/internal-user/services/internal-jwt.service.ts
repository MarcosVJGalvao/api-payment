import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InternalUserJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class InternalJwtService {
  private readonly secret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>(
      'INTERNAL_JWT_SECRET',
      'internal-jwt-secret-key',
    );
  }

  generateToken(payload: InternalUserJwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: '24h',
    });
  }

  verifyToken(token: string): InternalUserJwtPayload | null {
    try {
      return this.jwtService.verify<InternalUserJwtPayload>(token, {
        secret: this.secret,
      });
    } catch {
      return null;
    }
  }
}
