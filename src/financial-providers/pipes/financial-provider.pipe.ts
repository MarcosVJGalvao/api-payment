import { Injectable, HttpStatus, PipeTransform } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

const VALID_PROVIDERS = Object.values(FinancialProvider);

@Injectable()
export class FinancialProviderPipe implements PipeTransform<
  string,
  FinancialProvider
> {
  transform(value: string): FinancialProvider {
    const provider = VALID_PROVIDERS.find((p) => String(p) === value);

    if (!provider) {
      throw new CustomHttpException(
        `Invalid provider '${value}'. Accepted values: ${VALID_PROVIDERS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_FINANCIAL_PROVIDER,
      );
    }

    return provider;
  }
}
