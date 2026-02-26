import { readFileSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import {
  apiReference,
  type NestJSReferenceConfiguration,
} from '@scalar/nestjs-api-reference';
import { SwaggerService } from './swagger.service';
import { buildDocsPortalHtml } from './templates/docs-portal.template';
import { getManualTags } from './helpers/manual-tags.registry';

interface DocsVariant {
  key: string;
  apiPath: string;
  docsPath: string;
  openApiUrl: string;
  pageTitle: string;
  authKey?: string;
}

const DOCS_VARIANTS: DocsVariant[] = [
  {
    key: 'full',
    apiPath: 'api',
    docsPath: '/docs/api',
    openApiUrl: '/api/openapi.json',
    pageTitle: 'Payments API - API Reference',
  },
  {
    key: 'provider',
    apiPath: 'api/provider',
    docsPath: '/docs/api/provider',
    openApiUrl: '/api/provider/openapi.json',
    pageTitle: 'Payments API - Provider',
    authKey: 'provider-auth',
  },
  {
    key: 'backoffice',
    apiPath: 'api/backoffice',
    docsPath: '/docs/api/backoffice',
    openApiUrl: '/api/backoffice/openapi.json',
    pageTitle: 'Payments API - Backoffice',
    authKey: 'backoffice-auth',
  },
  {
    key: 'internal',
    apiPath: 'api/internal',
    docsPath: '/docs/api/internal',
    openApiUrl: '/api/internal/openapi.json',
    pageTitle: 'Payments API - Internal',
    authKey: 'internal-auth',
  },
];

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

  const scalarBaseConfig: NestJSReferenceConfiguration = {
    theme: 'deepSpace',
    layout: 'modern',
    forceDarkModeState: 'dark',
    hideDarkModeToggle: true,
    persistAuth: true,
    hideModels: false,
    defaultOpenAllTags: false,
    searchHotKey: 'k',
    showSidebar: true,
    withDefaultFonts: true,
    showDeveloperTools: 'localhost',
    defaultHttpClient: {
      targetKey: 'node',
      clientKey: 'axios',
    },
  };

  const expressApp = app.getHttpAdapter().getInstance();
  const markedJs = readFileSync(
    join(__dirname, '..', '..', 'node_modules', 'marked', 'lib', 'marked.umd.js'),
    'utf-8',
  );
  const scalarJs = readFileSync(
    join(
      __dirname,
      '..',
      '..',
      'node_modules',
      '@scalar',
      'api-reference',
      'dist',
      'browser',
      'standalone.js',
    ),
    'utf-8',
  );

  expressApp.get(
    '/docs/assets/marked.js',
    (
      _req: unknown,
      res: { type: (t: string) => { send: (h: string) => void } },
    ) => {
      res.type('application/javascript').send(markedJs);
    },
  );

  expressApp.get(
    '/docs/assets/scalar.js',
    (
      _req: unknown,
      res: { type: (t: string) => { send: (h: string) => void } },
    ) => {
      res.type('application/javascript').send(scalarJs);
    },
  );

  expressApp.get(
    '/favicon.ico',
    (
      _req: unknown,
      res: {
        status: (c: number) => { end: () => void };
      },
    ) => {
      res.status(204).end();
    },
  );

  const portalHtml = buildDocsPortalHtml(
    {
      title: 'Payments API',
      apiSpecUrl: '/api/openapi.json',
      scalarUrl: '/docs/api',
    },
    getManualTags(),
  );

  expressApp.get(
    '/docs',
    (
      _req: unknown,
      res: { type: (t: string) => { send: (h: string) => void } },
    ) => {
      res.type('html').send(portalHtml);
    },
  );

  const scalarConfig = {
    ...scalarBaseConfig,
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
