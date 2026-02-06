import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HttpStatus } from '@nestjs/common';

const providerValues = Object.values(FinancialProvider).filter(
  (value): value is FinancialProvider => typeof value === 'string',
);
const providerValuesSet = new Set<string>(providerValues);

export function isFinancialProvider(
  providerSlug: string,
): providerSlug is FinancialProvider {
  return providerValuesSet.has(providerSlug);
}

export function parseFinancialProvider(
  providerSlug: string,
): FinancialProvider {
  if (isFinancialProvider(providerSlug)) {
    return providerSlug;
  }

  throw new CustomHttpException(
    `Invalid provider: ${providerSlug}`,
    HttpStatus.BAD_REQUEST,
    ErrorCode.INVALID_FINANCIAL_PROVIDER,
  );
}
