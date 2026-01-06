import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProviderJwtService } from '../services/provider-jwt.service';
import { ProviderSessionService } from '../services/provider-session.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { REQUIRED_LOGIN_TYPE_KEY } from '../decorators/require-login-type.decorator';

@Injectable()
export class ProviderAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
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

        // Verificar tipo de login requerido (se especificado via decorator)
        const requiredLoginType = this.reflector.getAllAndOverride<'backoffice' | 'bank' | undefined>(
            REQUIRED_LOGIN_TYPE_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (requiredLoginType && session.loginType !== requiredLoginType) {
            throw new CustomHttpException(
                `Esta operação requer autenticação de ${requiredLoginType}`,
                HttpStatus.FORBIDDEN,
                ErrorCode.INVALID_LOGIN_TYPE,
            );
        }

        request.providerSession = session;
        return true;
    }
}
