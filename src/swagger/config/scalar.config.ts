import type { NestJSReferenceConfiguration } from '@scalar/nestjs-api-reference';

export const SCALAR_BASE_CONFIG: NestJSReferenceConfiguration = {
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

