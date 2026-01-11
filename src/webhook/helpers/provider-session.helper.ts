import { HttpStatus, Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { HiperbancoAuthService } from '@/financial-providers/hiperbanco/hiperbanco-auth.service';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AppLoggerService } from '@/common/logger/logger.service';

/**
 * Helper para gerenciar sessões compartilhadas do provedor com retry automático.
 */
@Injectable()
export class ProviderSessionHelper {
  private readonly context = ProviderSessionHelper.name;

  constructor(
    private readonly hiperbancoAuthService: HiperbancoAuthService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Cria uma sessão compartilhada para o provedor.
   */
  private createSharedSession(
    provider: FinancialProvider,
    token: string,
  ): ProviderSession {
    return {
      sessionId: 'SHARED_BACKOFFICE_SESSION',
      providerSlug: provider,
      clientId: 'SHARED_BACKOFFICE',
      hiperbancoToken: token,
      loginType: ProviderLoginType.BACKOFFICE,
      createdAt: Date.now(),
      expiresAt: Date.now() + 29 * 60 * 1000,
    };
  }

  /**
   * Verifica se o erro é de sessão expirada.
   */
  private isSessionExpiredError(error: unknown): boolean {
    if (!(error instanceof CustomHttpException)) {
      return false;
    }
    return String(error.errorCode) === String(ErrorCode.SESSION_EXPIRED);
  }

  /**
   * Garante uma sessão válida para o provedor.
   * @param session Sessão existente (opcional)
   * @param provider Provedor financeiro
   * @param forceRefresh Forçar renovação do token
   * @returns Sessão válida do provedor
   */
  async ensureSession(
    session: ProviderSession | null,
    provider: FinancialProvider,
    forceRefresh = false,
  ): Promise<ProviderSession> {
    if (session && !forceRefresh) return session;

    if (provider === FinancialProvider.HIPERBANCO) {
      const token = forceRefresh
        ? await this.hiperbancoAuthService.refreshSharedBackofficeSession()
        : await this.hiperbancoAuthService.getSharedBackofficeSession();
      return this.createSharedSession(provider, token);
    }

    throw new CustomHttpException(
      'Provider does not support shared session',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT,
    );
  }

  /**
   * Executa uma operação no provedor com retry automático em caso de sessão expirada.
   * @param provider Provedor financeiro
   * @param operation Função que executa a operação
   * @returns Resultado da operação
   */
  async executeWithRetry<T>(
    provider: FinancialProvider,
    operation: (session: ProviderSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.ensureSession(null, provider);

    try {
      return await operation(session);
    } catch (error) {
      // Verifica se é erro de sessão expirada
      if (this.isSessionExpiredError(error)) {
        this.logger.log(
          'Session expired, refreshing token and retrying...',
          this.context,
        );

        // Obtém nova sessão forçando refresh
        const newSession = await this.ensureSession(null, provider, true);

        // Tenta novamente com a nova sessão
        return await operation(newSession);
      }

      throw error;
    }
  }
}
