import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import {
  apiReference,
} from '@scalar/nestjs-api-reference';
import { SwaggerService } from './swagger.service';
import { getManualTags } from './helpers/manual-tags.registry';
import { DOCS_VARIANTS } from './config/docs-variants.config';
import { SCALAR_BASE_CONFIG } from './config/scalar.config';
import { registerDocsPortalRoutes } from './portal/controllers/register-docs-portal.routes';

export function setupApiDocumentation(
  app: INestApplication,
  swaggerService: SwaggerService,
): void {
  const swaggerOptions = { persistAuthorization: true };

  for (const variant of DOCS_VARIANTS) {
    const document = variant.authKey
      ? swaggerService.getFilteredDocument(variant.authKey)
      : swaggerService.getSwaggerDocument();

    SwaggerModule.setup(variant.apiPath, app, document, {
      jsonDocumentUrl: variant.openApiUrl,
      swaggerOptions,
    });
  }

  registerDocsPortalRoutes(app, {
    title: 'Payments API',
    apiSpecUrl: '/api/openapi.json',
    scalarUrl: '/docs/api',
    manualTags: getManualTags(),
  });
  const expressApp = app.getHttpAdapter().getInstance();

  const scalarConfig = {
    ...SCALAR_BASE_CONFIG,
    cdn: '/docs/assets/scalar.js',
  };

  for (const variant of DOCS_VARIANTS) {
    expressApp.use(
      variant.docsPath,
      apiReference({
        ...scalarConfig,
        pageTitle: variant.pageTitle,
        url: variant.openApiUrl,
      }),
    );
  }
}
