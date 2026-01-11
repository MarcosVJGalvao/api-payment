import { Injectable, Inject } from '@nestjs/common';
import { HiperbancoHttpService } from './hiperbanco-http.service';
import { FinancialCredentialsService } from '../services/financial-credentials.service';
import { ProviderSessionService } from '../services/provider-session.service';
import { ProviderJwtService } from '../services/provider-jwt.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import { RedisService } from '@/common/redis/redis.service';
import {
  BackofficeLoginResponse,
  BankLoginResponse,
  HiperbancoAccount,
} from './interfaces/hiperbanco-responses.interface';
import { BankLoginDto } from '../dto/bank-login.dto';
import { BackofficeLoginDto } from '../dto/backoffice-login.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { HiperbancoConfig } from './helpers/hiperbanco-config.helper';
import { AccountService } from '@/account/account.service';
import { OnboardingService } from '@/onboarding/onboarding.service';
import { Onboarding } from '@/onboarding/entities/onboarding.entity';
import { ProviderLoginType } from '../enums/provider-login-type.enum';
import { HiperbancoEndpoint } from './enums/hiperbanco-endpoint.enum';
import {
  persistAccounts,
  getPrimaryAccount,
  persistOnboarding,
  mapAccountsToResponse,
  createSessionAndToken,
} from './helpers/bank-login.helper';

export interface AuthLoginResponse {
  access_token: string;
  sessionId: string;
  documentNumber?: string;
  registerName?: string;
  accounts?: HiperbancoAccount[];
}

@Injectable()
export class HiperbancoAuthService {
  private readonly PROVIDER_SLUG = FinancialProvider.HIPERBANCO;
  private readonly context = HiperbancoAuthService.name;

  constructor(
    private readonly http: HiperbancoHttpService,
    private readonly credentialsService: FinancialCredentialsService,
    private readonly sessionService: ProviderSessionService,
    private readonly jwtService: ProviderJwtService,
    private readonly logger: AppLoggerService,
    private readonly accountService: AccountService,
    private readonly onboardingService: OnboardingService,
    @Inject('HIPERBANCO_CONFIG') private readonly config: HiperbancoConfig,
    private readonly redisService: RedisService,
  ) {}

  async getSharedBackofficeSession(): Promise<string> {
    const CACHE_KEY = 'hiperbanco:shared_backoffice_token';
    const cachedToken = await this.redisService.get(CACHE_KEY);

    if (cachedToken) {
      return cachedToken;
    }

    this.logger.log(
      'Shared Backoffice session not found or expired. Logging in...',
      this.context,
    );

    const payload = {
      email: this.config.backofficeUser,
      password: this.config.backofficePass,
      client_id: this.config.clientId,
    };

    try {
      const response = await this.http.post<BackofficeLoginResponse>(
        HiperbancoEndpoint.LOGIN_BACKOFFICE,
        payload,
      );

      // Cache for 50 minutes (assuming 1h token life usually, being conservative)
      await this.redisService.set(CACHE_KEY, response.access_token, 50 * 60);

      this.logger.log('Shared Backoffice login successful', this.context);
      return response.access_token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to login with shared backoffice credentials: ${errorMessage}`,
        errorStack,
        this.context,
      );
      throw error;
    }
  }

  async loginBackoffice(
    loginDto: BackofficeLoginDto,
  ): Promise<AuthLoginResponse> {
    this.logger.log('Initiating Backoffice login for Hiperbanco', this.context);

    const credentials = await this.credentialsService.getPublicCredentials(
      this.PROVIDER_SLUG,
      ProviderLoginType.BACKOFFICE,
    );

    const payload = {
      email: loginDto.email,
      password: loginDto.password,
      client_id: this.config.clientId,
    };

    const response = await this.http.post<BackofficeLoginResponse>(
      HiperbancoEndpoint.LOGIN_BACKOFFICE,
      payload,
    );
    this.logger.log('Backoffice login successful', this.context);

    const { session, token } = await createSessionAndToken(
      {
        providerSlug: this.PROVIDER_SLUG,
        clientId: credentials.clientId!,
        hiperbancoToken: response.access_token,
        loginType: ProviderLoginType.BACKOFFICE,
      },
      this.sessionService,
      this.jwtService,
    );

    return {
      access_token: token,
      sessionId: session.sessionId,
    };
  }

  async loginApiBank(
    loginDto: BankLoginDto,
    clientId: string,
  ): Promise<AuthLoginResponse> {
    this.logger.log(
      `Initiating API Bank login for document: ${loginDto.document.substring(0, 3)}***`,
      this.context,
    );

    const requestPayload = {
      document: loginDto.document,
      password: loginDto.password,
      clientId: this.config.clientId,
    };

    const response = await this.http.post<BankLoginResponse>(
      HiperbancoEndpoint.LOGIN_BANK,
      requestPayload,
    );
    this.logger.log('API Bank login successful', this.context);

    // Persistir Onboarding primeiro (se houver userData)
    let onboarding: Onboarding | null = null;
    if (response.userData) {
      onboarding = await persistOnboarding(
        response.userData,
        clientId,
        this.onboardingService,
      );
    }

    // Persistir Accounts e associar ao onboarding
    const accountsFromProvider = response.userData?.accounts || [];
    const savedAccounts = await persistAccounts(
      accountsFromProvider,
      clientId,
      this.accountService,
      onboarding?.id,
    );

    // Determinar primeira conta (principal) - usar ID interno gerado pelo banco
    const primaryAccount = getPrimaryAccount(savedAccounts);

    const { session, token } = await createSessionAndToken(
      {
        providerSlug: this.PROVIDER_SLUG,
        clientId,
        hiperbancoToken: response.access_token,
        userId: response.userData?.id,
        accountId: primaryAccount.id, // ID interno do banco
        loginType: ProviderLoginType.BANK,
      },
      this.sessionService,
      this.jwtService,
    );

    // Mapear accounts salvos no banco para resposta (com ID interno)
    const accountsFromResponse = mapAccountsToResponse(savedAccounts);

    return {
      access_token: token,
      sessionId: session.sessionId,
      documentNumber: response.userData?.documentNumber,
      registerName: response.userData?.registerName,
      accounts: accountsFromResponse,
    };
  }
}
