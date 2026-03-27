import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { ProviderSession } from '../contracts/provider-session';
import { isFinancialProvider } from '@/webhook-processor/helpers/provider-slug.helper';

type RequestWithProviderParam = {
  params?: { provider?: string };
  providerSession?: ProviderSession;
};

@Injectable()
export class ProviderSessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithProviderParam>();

    const providerParam = request.params?.provider;
    if (!providerParam) {
      return true;
    }

    const session = request.providerSession;
    if (!session) {
      return true;
    }

    if (!isFinancialProvider(providerParam)) {
      throw new CustomHttpException(
        'Provedor financeiro inválido',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_FINANCIAL_PROVIDER,
      );
    }

    const providerSlug: FinancialProvider = providerParam;
    if (session.providerSlug !== providerSlug) {
      throw new CustomHttpException(
        'Sessão autenticada para outro provedor',
        HttpStatus.FORBIDDEN,
        ErrorCode.INVALID_SESSION,
      );
    }

    return true;
  }
}
