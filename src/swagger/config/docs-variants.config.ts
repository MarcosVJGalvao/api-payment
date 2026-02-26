export interface DocsVariant {
  key: string;
  apiPath: string;
  docsPath: string;
  openApiUrl: string;
  pageTitle: string;
  authKey?: string;
}

export const DOCS_VARIANTS: DocsVariant[] = [
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

