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
  AuthLoginResponse,
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
import { getErrorMessageAndStack } from '@/common/helpers/exception.helper';
import {
  persistAccounts,
  getPrimaryAccount,
  persistOnboarding,
  mapAccountsToResponse,
  createSessionAndToken,
} from './helpers/bank-login.helper';

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

  private readonly CACHE_KEY = 'hiperbanco:shared_backoffice_token';

  async getSharedBackofficeSession(): Promise<string> {
    const cachedToken = await this.redisService.get(this.CACHE_KEY);

    if (cachedToken) {
      return cachedToken;
    }

    return this.refreshSharedBackofficeSession();
  }

  /**
   * Invalida o token atual e obtém um novo token do provedor.
   * Usado quando a sessão expira durante uma operação.
   */
  async refreshSharedBackofficeSession(): Promise<string> {
    await this.redisService.del(this.CACHE_KEY);

    this.logger.log(
      'Shared Backoffice session expired or not found. Logging in...',
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

      await this.redisService.set(
        this.CACHE_KEY,
        response.access_token,
        29 * 60,
      );

      this.logger.log('Shared Backoffice login successful', this.context);
      return response.access_token;
    } catch (error) {
      const { message: errorMessage, stack: errorStack } =
        getErrorMessageAndStack(error);

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
        accessToken: response.access_token,
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

    let onboarding: Onboarding | null = null;
    if (response.userData) {
      onboarding = await persistOnboarding(
        response.userData,
        clientId,
        this.onboardingService,
      );
    }

    const accountsFromProvider = response.userData?.accounts || [];
    const savedAccounts = await persistAccounts(
      accountsFromProvider,
      clientId,
      this.accountService,
      onboarding?.id,
    );

    const primaryAccount = getPrimaryAccount(savedAccounts);

    const { session, token } = await createSessionAndToken(
      {
        providerSlug: this.PROVIDER_SLUG,
        clientId,
        accessToken: response.access_token,
        userId: response.userData?.id,
        accountId: primaryAccount.id,
        loginType: ProviderLoginType.BANK,
      },
      this.sessionService,
      this.jwtService,
    );

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
