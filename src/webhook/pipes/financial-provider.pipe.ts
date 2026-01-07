import { PipeTransform, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

/**
 * Pipe para validar e transformar o parâmetro provider em FinancialProvider enum.
 */
@Injectable()
export class FinancialProviderPipe implements PipeTransform<string, FinancialProvider> {
    transform(value: string): FinancialProvider {
        const validProviders = Object.values(FinancialProvider);

        if (!validProviders.includes(value as FinancialProvider)) {
            throw new CustomHttpException(
                `Provider '${value}' inválido. Valores aceitos: ${validProviders.join(', ')}`,
                HttpStatus.BAD_REQUEST,
                ErrorCode.INVALID_FINANCIAL_PROVIDER,
            );
        }

        return value as FinancialProvider;
    }
}
