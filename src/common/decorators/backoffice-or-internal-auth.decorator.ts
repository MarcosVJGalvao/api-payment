import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BackofficeOrInternalGuard } from '@/backoffice-user/guards/backoffice-or-internal.guard';

/**
 * Decorator combinado que aplica:
 * - BackofficeOrInternalGuard (permite acesso via backoffice OU internal)
 * - ApiBearerAuth para 'backoffice-auth' e 'internal-auth' (documenta ambos no Swagger)
 *
 * Uso:
 * @BackofficeOrInternalAuth()
 * @Controller('example')
 * export class ExampleController {}
 */
export function BackofficeOrInternalAuth() {
  return applyDecorators(
    UseGuards(BackofficeOrInternalGuard),
    ApiBearerAuth('backoffice-auth'),
    ApiBearerAuth('internal-auth'),
  );
}
