import { applyDecorators, SetMetadata } from '@nestjs/common';
import { RequireClient } from '@/common/decorators/require-client.decorator';
import { RequireClientAccount } from '@/common/decorators/require-client-account.decorator';

export const REQUIRED_LOGIN_TYPE_KEY = 'requiredLoginType';

/**
 * Decorator para especificar o tipo de login requerido para a rota.
 * Automaticamente aplica:
 * - @RequireClient() para todos os tipos de login
 * - @RequireClientAccount() quando loginType é 'bank' (pois login bank sempre precisa de accountId)
 * @param loginType Tipo de login: 'backoffice' ou 'bank'
 */
export const RequireLoginType = (loginType: 'backoffice' | 'bank') => {
    if (loginType === 'bank') {
        return applyDecorators(
            RequireClientAccount(),
            SetMetadata(REQUIRED_LOGIN_TYPE_KEY, loginType),
        );
    }
    
    return applyDecorators(
        RequireClient(),
        SetMetadata(REQUIRED_LOGIN_TYPE_KEY, loginType),
    );
};
