import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Marca um controller inteiro para ficar oculto no Portal de Documentação e no Scalar,
 * mantendo a exibição no Swagger UI.
 */
export function ApiControllerHideFromPortalScalar(...tags: string[]) {
  return applyDecorators(ApiTags(...tags, 'portal:hidden'));
}
