import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

export interface HiperbancoConfig {
  baseUrl: string;
  clientId: string;
  backofficeUser: string;
  backofficePass: string;
}

/**
 * Validates and retrieves the Hiperbanco configuration.
 * Throws an exception if required environment variables are missing.
 */
export function getHiperbancoConfig(
  configService: ConfigService,
): HiperbancoConfig {
  const baseUrl = configService.get<string>('HIPERBANCO_API_URL');
  const clientId = configService.get<string>('HIPERBANCO_CLIENT_ID');
  const backofficeUser = configService.get<string>(
    'HIPERBANCO_BACKOFFICE_USER',
  );
  const backofficePass = configService.get<string>(
    'HIPERBANCO_BACKOFFICE_PASS',
  );

  if (!baseUrl || !clientId || !backofficeUser || !backofficePass) {
    throw new CustomHttpException(
      'Missing required HIPERBANCO environment variables.',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.ENVIRONMENT_VARIABLE_MISSING,
    );
  }

  return { baseUrl, clientId, backofficeUser, backofficePass };
}
