import { SetMetadata } from '@nestjs/common';

export const REQUIRED_LOGIN_TYPE_KEY = 'requiredLoginType';

/**
 * Decorator para especificar o tipo de login requerido para a rota.
 * @param loginType Tipo de login: 'backoffice' ou 'bank'
 */
export const RequireLoginType = (loginType: 'backoffice' | 'bank') =>
    SetMetadata(REQUIRED_LOGIN_TYPE_KEY, loginType);
