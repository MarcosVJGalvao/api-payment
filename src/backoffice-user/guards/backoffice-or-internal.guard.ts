import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { InternalAuthGuard } from '@/internal-user/guards/internal-auth.guard';
import { BackofficeAuthGuard } from './backoffice-auth.guard';
import { AppLoggerService } from '@/common/logger/logger.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

@Injectable()
export class BackofficeOrInternalGuard implements CanActivate {
  constructor(
    private readonly internalGuard: InternalAuthGuard,
    private readonly backofficeGuard: BackofficeAuthGuard,
    private readonly logger: AppLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try Internal Guard first
      const canActivateInternal = await this.internalGuard.canActivate(context);
      if (canActivateInternal) {
        return true;
      }
    } catch (error) {
      this.logger.warn(
        `Internal auth failed (fallback to backoffice): ${error.message}`,
        BackofficeOrInternalGuard.name,
      );
      // We do not throw CustomHttpException here to allow fallback to Backoffice Guard
    }

    try {
      // Try Backoffice Guard
      const canActivateBackoffice =
        await this.backofficeGuard.canActivate(context);
      if (canActivateBackoffice) {
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Backoffice auth failed: ${error.message}`,
        error.stack,
        BackofficeOrInternalGuard.name,
      );
      throw new CustomHttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    this.logger.warn(
      'User not authenticated via Backoffice or Internal guard',
      BackofficeOrInternalGuard.name,
    );
    throw new CustomHttpException(
      'User not authenticated',
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED,
    );
  }
}
