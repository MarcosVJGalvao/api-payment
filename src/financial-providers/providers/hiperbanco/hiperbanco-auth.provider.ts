import { Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import {
  AuthProvider,
  LoginBackofficeResult,
  LoginBankResult,
} from '@/financial-providers/contracts/auth.provider';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';
import { HiperbancoAuthService } from '@/financial-providers/hiperbanco/hiperbanco-auth.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import type { BackofficeLoginDto } from '@/financial-providers/dto/backoffice-login.dto';
import type { BankLoginDto } from '@/financial-providers/dto/bank-login.dto';

@Injectable()
export class HiperbancoAuthProvider implements AuthProvider {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  constructor(private readonly hiperbancoAuth: HiperbancoAuthService) {}

  supports(loginType: ProviderLoginType): boolean {
    return (
      loginType === ProviderLoginType.BACKOFFICE ||
      loginType === ProviderLoginType.BANK
    );
  }

  private isBackofficeLoginDto(value: unknown): value is BackofficeLoginDto {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Record<string, unknown>)['email'] === 'string' &&
      typeof (value as Record<string, unknown>)['password'] === 'string'
    );
  }

  private isBankLoginDto(value: unknown): value is BankLoginDto {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Record<string, unknown>)['document'] === 'string' &&
      typeof (value as Record<string, unknown>)['password'] === 'string'
    );
  }

  async loginBackoffice(dto: unknown): Promise<LoginBackofficeResult> {
    if (!this.isBackofficeLoginDto(dto)) {
      throw new CustomHttpException(
        'Invalid backoffice login payload',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }

    const result = await this.hiperbancoAuth.loginBackoffice(dto);

    return {
      accessToken: result.access_token,
      metadata: { sessionId: result.sessionId },
    };
  }

  async loginBank(dto: unknown, clientId: string): Promise<LoginBankResult> {
    if (!this.isBankLoginDto(dto)) {
      throw new CustomHttpException(
        'Invalid bank login payload',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }

    const result = await this.hiperbancoAuth.loginApiBank(dto, clientId);

    if (!result?.access_token) {
      throw new CustomHttpException(
        'Provider login failed',
        HttpStatus.BAD_GATEWAY,
        ErrorCode.PROVIDER_AUTH_FAILED,
      );
    }

    return {
      accessToken: result.access_token,
      metadata: {
        sessionId: result.sessionId,
        accounts: result.accounts,
      },
    };
  }
}
