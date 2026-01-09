import { HttpStatus } from '@nestjs/common';
import { Account } from '@/account/entities/account.entity';
import {
  AccountService,
  CreateOrUpdateAccountData,
} from '@/account/account.service';
import {
  OnboardingService,
  CreateOrUpdateOnboardingData,
} from '@/onboarding/onboarding.service';
import { Onboarding } from '@/onboarding/entities/onboarding.entity';
import { OnboardingTypeAccount } from '@/onboarding/enums/onboarding-type-account.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import {
  HiperbancoAccount,
  BankLoginUserData,
} from '../interfaces/hiperbanco-responses.interface';
import { parseAccountStatus, parseAccountType } from './account-parser.helper';
import { ProviderSessionService } from '../../services/provider-session.service';
import { ProviderJwtService } from '../../services/provider-jwt.service';
import { ProviderSession } from '../interfaces/provider-session.interface';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderLoginType } from '../../enums/provider-login-type.enum';

/**
 * Persiste as accounts recebidas da API do Hiperbanco
 * @param accounts - Array de accounts do Hiperbanco
 * @param clientId - ID do cliente multi-tenant
 * @param onboardingId - ID do onboarding (opcional, para associar accounts ao onboarding)
 * @param accountService - Serviço de accounts
 * @returns Array de accounts persistidas
 */
export async function persistAccounts(
  accounts: HiperbancoAccount[],
  clientId: string,
  accountService: AccountService,
  onboardingId?: string,
): Promise<Account[]> {
  const savedAccounts: Account[] = [];

  for (const account of accounts) {
    const accountData: CreateOrUpdateAccountData = {
      status: parseAccountStatus(account.status),
      branch: account.branch,
      number: account.number,
      type: parseAccountType(account.type),
      onboardingId,
    };

    const savedAccount = await accountService.createOrUpdate(
      account.id,
      clientId,
      accountData,
    );
    savedAccounts.push(savedAccount);
  }

  return savedAccounts;
}

/**
 * Valida e retorna a conta principal (primeira conta)
 * @param savedAccounts - Array de accounts persistidas
 * @returns A conta principal
 * @throws CustomHttpException se não houver accounts
 */
export function getPrimaryAccount(savedAccounts: Account[]): Account {
  const primaryAccount = savedAccounts[0];
  if (!primaryAccount) {
    throw new CustomHttpException(
      'No accounts found in response',
      HttpStatus.BAD_REQUEST,
      ErrorCode.ACCOUNT_NOT_FOUND,
    );
  }
  return primaryAccount;
}

/**
 * Converte typeAccount da API do Hiperbanco para OnboardingTypeAccount
 * @param typeAccount - Tipo da conta da API ('PF' | 'PJ')
 * @returns OnboardingTypeAccount correspondente
 */
export function parseOnboardingTypeAccount(
  typeAccount?: 'PF' | 'PJ',
): OnboardingTypeAccount {
  return typeAccount === 'PJ'
    ? OnboardingTypeAccount.PJ
    : OnboardingTypeAccount.PF;
}

/**
 * Persiste dados de onboarding do usuário
 * @param userData - Dados do usuário da resposta da API
 * @param clientId - ID do cliente multi-tenant
 * @param onboardingService - Serviço de onboarding
 * @returns Onboarding criado ou atualizado
 */
export async function persistOnboarding(
  userData: BankLoginUserData,
  clientId: string,
  onboardingService: OnboardingService,
): Promise<Onboarding | null> {
  if (!userData.id) {
    return null;
  }

  const onboardingData: CreateOrUpdateOnboardingData = {
    registerName: userData.registerName || '',
    documentNumber: userData.documentNumber || '',
    typeAccount: parseOnboardingTypeAccount(userData.typeAccount),
  };

  return onboardingService.createOrUpdate(
    userData.id,
    clientId,
    onboardingData,
  );
}

/**
 * Mapeia accounts salvos no banco para o formato de resposta (sem clientId e campos internos)
 * @param savedAccounts - Array de accounts persistidas no banco de dados
 * @returns Array de accounts formatadas para resposta com ID interno gerado pelo banco
 */
export function mapAccountsToResponse(
  savedAccounts: Account[],
): HiperbancoAccount[] {
  return savedAccounts.map((account) => {
    return {
      id: account.id,
      status: account.status,
      branch: account.branch,
      number: account.number,
      type: account.type,
    };
  });
}

/**
 * Interface para parâmetros de criação de sessão e token
 */
export interface CreateSessionAndTokenParams {
  providerSlug: FinancialProvider;
  clientId: string;
  hiperbancoToken: string;
  loginType: ProviderLoginType;
  userId?: string;
  accountId?: string;
}

/**
 * Interface para resultado da criação de sessão e token
 */
export interface SessionAndToken {
  session: ProviderSession;
  token: string;
}

/**
 * Cria uma sessão de provedor e gera o token JWT correspondente
 * @param params - Parâmetros para criação da sessão
 * @param sessionService - Serviço de sessão
 * @param jwtService - Serviço JWT
 * @returns Objeto contendo a sessão criada e o token JWT
 */
export async function createSessionAndToken(
  params: CreateSessionAndTokenParams,
  sessionService: ProviderSessionService,
  jwtService: ProviderJwtService,
): Promise<SessionAndToken> {
  const session = await sessionService.createSession({
    providerSlug: params.providerSlug,
    clientId: params.clientId,
    hiperbancoToken: params.hiperbancoToken,
    loginType: params.loginType,
    userId: params.userId,
    accountId: params.accountId,
  });

  const token = jwtService.generateToken({
    sessionId: session.sessionId,
    providerSlug: session.providerSlug,
    clientId: session.clientId,
    accountId: session.accountId,
    loginType: session.loginType,
  });

  return { session, token };
}
