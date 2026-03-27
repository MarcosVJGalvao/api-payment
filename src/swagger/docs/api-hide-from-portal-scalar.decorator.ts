import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Marca uma operação para ficar oculta no Portal de Documentação e no Scalar,
 * mantendo a exibição no Swagger UI.
 */
export function ApiHideFromPortalScalar() {
  return applyDecorators(ApiTags('portal:hidden'));
}
