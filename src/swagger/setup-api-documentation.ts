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
import type { Request, Response } from 'express';

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
    apiSpecUrl: '/api/docs/portal-scalar/openapi.json',
    scalarUrl: '/docs/api',
    manualTags: getManualTags(),
  });
  const expressApp = app.getHttpAdapter().getInstance();

  const sendJson = (res: Response, document: unknown) => {
    res.setHeader('Content-Type', 'application/json');
    return res.json(document);
  };

  expressApp.get('/api/docs/portal-scalar/openapi.json', (_req: Request, res: Response) =>
    sendJson(res, swaggerService.getPortalScalarDocument()),
  );
  expressApp.get(
    '/api/docs/portal-scalar/provider/openapi.json',
    (_req: Request, res: Response) =>
      sendJson(res, swaggerService.getPortalScalarDocument('provider-auth')),
  );
  expressApp.get(
    '/api/docs/portal-scalar/backoffice/openapi.json',
    (_req: Request, res: Response) =>
      sendJson(res, swaggerService.getPortalScalarDocument('backoffice-auth')),
  );
  expressApp.get(
    '/api/docs/portal-scalar/internal/openapi.json',
    (_req: Request, res: Response) =>
      sendJson(res, swaggerService.getPortalScalarDocument('internal-auth')),
  );

  const scalarConfig = {
    ...SCALAR_BASE_CONFIG,
    cdn: '/docs/assets/scalar.js',
  };

  const getScalarOpenApiUrl = (authKey?: string) => {
    if (!authKey) return '/api/docs/portal-scalar/openapi.json';
    if (authKey === 'provider-auth') return '/api/docs/portal-scalar/provider/openapi.json';
    if (authKey === 'backoffice-auth') return '/api/docs/portal-scalar/backoffice/openapi.json';
    if (authKey === 'internal-auth') return '/api/docs/portal-scalar/internal/openapi.json';
    return '/api/docs/portal-scalar/openapi.json';
  };

  for (const variant of DOCS_VARIANTS) {
    expressApp.use(
      variant.docsPath,
      apiReference({
        ...scalarConfig,
        pageTitle: variant.pageTitle,
        url: getScalarOpenApiUrl(variant.authKey),
      }),
    );
  }
}
