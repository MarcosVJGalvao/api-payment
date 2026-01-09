import { applyDecorators, SetMetadata } from '@nestjs/common';
import { RequireClient } from '@/common/decorators/require-client.decorator';
import { RequireClientAccount } from '@/common/decorators/require-client-account.decorator';
import { ProviderLoginType } from '../enums/provider-login-type.enum';

export const REQUIRED_LOGIN_TYPE_KEY = 'requiredLoginType';

/**
 * Decorator para especificar o tipo de login requerido para a rota.
 * Automaticamente aplica:
 * - @RequireClient() para todos os tipos de login
 * - @RequireClientAccount() quando loginType é BANK (pois login bank sempre precisa de accountId)
 * @param loginType Tipo de login: BACKOFFICE (email/senha) ou BANK (documento/senha)
 */
export const RequireLoginType = (loginType: ProviderLoginType) => {
  if (loginType === ProviderLoginType.BANK) {
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
