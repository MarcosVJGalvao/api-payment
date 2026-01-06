import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ProviderJwtPayload } from '../hiperbanco/interfaces/provider-session.interface';

@Injectable()
export class ProviderJwtService {
    private readonly secret: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.secret = this.configService.get<string>('PROVIDER_JWT_SECRET', 'provider-jwt-secret-key');
    }

    generateToken(payload: ProviderJwtPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.secret,
            expiresIn: '30m',
        });
    }

    verifyToken(token: string): ProviderJwtPayload | null {
        try {
            return this.jwtService.verify<ProviderJwtPayload>(token, {
                secret: this.secret,
            });
        } catch {
            return null;
        }
    }
}
