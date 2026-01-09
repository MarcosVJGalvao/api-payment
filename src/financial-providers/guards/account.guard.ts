import { Injectable, ExecutionContext, HttpStatus, CanActivate } from '@nestjs/common';
import { AccountService } from '@/account/account.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { ProviderJwtService } from '../services/provider-jwt.service';
import { ProviderSession } from '../hiperbanco/interfaces/provider-session.interface';

export interface RequestWithAccount {
  clientId?: string;
  accountId?: string;
  providerSession?: ProviderSession;
  headers: {
    authorization?: string;
    'x-client-id'?: string;
    'X-Client-Id'?: string;
    'x-account-id'?: string;
    'X-Account-Id'?: string;
    [key: string]: string | string[] | undefined;
  };
  [key: string]: unknown;
}

@Injectable()
export class AccountGuard implements CanActivate {
  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: ProviderJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAccount>();
    const clientId = request.clientId || request.headers['x-client-id'] || request.headers['X-Client-Id'];

    if (!clientId || typeof clientId !== 'string') {
      throw new CustomHttpException(
        'X-Client-Id header is required',
        HttpStatus.BAD_REQUEST,
        ErrorCode.CLIENT_NOT_FOUND,
      );
    }

    // Tentar obter accountId da session primeiro, depois do JWT, depois do header
    let accountId: string | undefined;

    if (request.providerSession?.accountId) {
      accountId = request.providerSession.accountId;
    } else if (request.headers.authorization) {
      // Tentar extrair do JWT
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verifyToken(token);
        if (payload?.accountId) {
          accountId = payload.accountId;
        }
      }
    }

    if (!accountId) {
      // Tentar do header como última opção
      accountId = request.headers['x-account-id'] || request.headers['X-Account-Id'];
    }

    if (!accountId) {
      throw new CustomHttpException(
        'Account ID is required. Please authenticate with bank login first.',
        HttpStatus.BAD_REQUEST,
        ErrorCode.ACCOUNT_NOT_FOUND,
      );
    }

    // Validar que accountId pertence ao clientId
    await this.accountService.validateAccountBelongsToClient(accountId, clientId);

    request.clientId = clientId;
    request.accountId = accountId;

    return true;
  }
}
