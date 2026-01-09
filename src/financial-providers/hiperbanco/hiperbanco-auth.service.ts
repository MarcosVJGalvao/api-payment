import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { HiperbancoHttpService } from './hiperbanco-http.service';
import { FinancialCredentialsService } from '../services/financial-credentials.service';
import { ProviderSessionService } from '../services/provider-session.service';
import { ProviderJwtService } from '../services/provider-jwt.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import { BackofficeLoginResponse, BankLoginResponse, HiperbancoAccount } from './interfaces/hiperbanco-responses.interface';
import { BankLoginDto } from '../dto/bank-login.dto';
import { BackofficeLoginDto } from '../dto/backoffice-login.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { HiperbancoConfig } from './helpers/hiperbanco-config.helper';
import { AccountService } from '@/account/account.service';
import { OnboardingService } from '@/onboarding/onboarding.service';
import { Account, AccountStatus, AccountType } from '@/account/entities/account.entity';
import { OnboardingTypeAccount } from '@/onboarding/enums/onboarding-type-account.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { ProviderLoginType } from '../enums/provider-login-type.enum';

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
    ) { }

    async loginBackoffice(loginDto: BackofficeLoginDto): Promise<AuthLoginResponse> {
        this.logger.log('Initiating Backoffice login for Hiperbanco', this.context);

        const credentials = await this.credentialsService.getPublicCredentials(this.PROVIDER_SLUG, ProviderLoginType.BACKOFFICE);

        const payload = {
            email: loginDto.email,
            password: loginDto.password,
            client_id: this.config.clientId,
        };

        const response = await this.http.post<BackofficeLoginResponse>('/Backoffice/Login', payload);
        this.logger.log('Backoffice login successful', this.context);

        const session = await this.sessionService.createSession({
            providerSlug: this.PROVIDER_SLUG,
            clientId: credentials.clientId!,
            hiperbancoToken: response.access_token,
            loginType: ProviderLoginType.BACKOFFICE,
        });

        const token = this.jwtService.generateToken({
            sessionId: session.sessionId,
            providerSlug: session.providerSlug,
            clientId: session.clientId,
            loginType: session.loginType,
        });

        return {
            access_token: token,
            sessionId: session.sessionId,
        };
    }

    async loginApiBank(loginDto: BankLoginDto, clientId: string): Promise<AuthLoginResponse> {
        this.logger.log(`Initiating API Bank login for document: ${loginDto.document.substring(0, 3)}***`, this.context);

        const credentials = await this.credentialsService.getPublicCredentials(this.PROVIDER_SLUG, ProviderLoginType.BANK);

        const requestPayload = {
            document: loginDto.document,
            password: loginDto.password,
            clientId: this.config.clientId,
        };

        const response = await this.http.post<BankLoginResponse>('/Users/login/api-bank', requestPayload);
        this.logger.log('API Bank login successful', this.context);

        // Persistir Accounts
        const accounts = response.userData?.accounts || [];
        const savedAccounts: Account[] = [];

        for (const account of accounts) {
            const savedAccount = await this.accountService.createOrUpdate(
                account.id,
                clientId,
                {
                    status: account.status as AccountStatus,
                    branch: account.branch,
                    number: account.number,
                    type: account.type as AccountType,
                },
            );
            savedAccounts.push(savedAccount);
        }

        // Determinar primeira conta (principal)
        const primaryAccount = savedAccounts[0];
        if (!primaryAccount) {
            throw new CustomHttpException(
                'No accounts found in response',
                HttpStatus.BAD_REQUEST,
                ErrorCode.ACCOUNT_NOT_FOUND,
            );
        }

        // Persistir Onboarding
        if (response.userData?.id) {
            const typeAccount = response.userData.typeAccount === 'PJ' 
                ? OnboardingTypeAccount.PJ 
                : OnboardingTypeAccount.PF;

            await this.onboardingService.createOrUpdate(
                response.userData.id,
                clientId,
                primaryAccount.id,
                {
                    registerName: response.userData.registerName || '',
                    documentNumber: response.userData.documentNumber || '',
                    typeAccount,
                },
            );
        }

        const session = await this.sessionService.createSession({
            providerSlug: this.PROVIDER_SLUG,
            clientId,
            hiperbancoToken: response.access_token,
            userId: response.userData?.id,
            accountId: primaryAccount.id,
            loginType: ProviderLoginType.BANK,
        });

        const token = this.jwtService.generateToken({
            sessionId: session.sessionId,
            providerSlug: session.providerSlug,
            clientId: session.clientId,
            accountId: session.accountId,
            loginType: session.loginType,
        });

        // Retornar as accounts originais do response do Hiperbanco (sem clientId)
        const accountsFromResponse: HiperbancoAccount[] = accounts.map(({ id, status, branch, number, type }) => ({
            id,
            status,
            branch,
            number,
            type,
        }));

        return {
            access_token: token,
            sessionId: session.sessionId,
            documentNumber: response.userData?.documentNumber,
            registerName: response.userData?.registerName,
            accounts: accountsFromResponse,
        };
    }
}
