import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { ProviderJwtService } from '../services/provider-jwt.service';
import { ProviderSessionService } from '../services/provider-session.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

@Injectable()
export class ProviderAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: ProviderJwtService,
        private readonly sessionService: ProviderSessionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new CustomHttpException(
                'Authorization header missing or invalid',
                HttpStatus.UNAUTHORIZED,
                ErrorCode.INVALID_SESSION,
            );
        }

        const token = authHeader.substring(7);
        const payload = this.jwtService.verifyToken(token);

        if (!payload) {
            throw new CustomHttpException(
                'Invalid or expired token',
                HttpStatus.UNAUTHORIZED,
                ErrorCode.INVALID_SESSION,
            );
        }

        const session = await this.sessionService.getSession(payload.sessionId);

        if (!session) {
            throw new CustomHttpException(
                'Session expired or not found',
                HttpStatus.UNAUTHORIZED,
                ErrorCode.SESSION_EXPIRED,
            );
        }

        request.providerSession = session;
        return true;
    }
}
