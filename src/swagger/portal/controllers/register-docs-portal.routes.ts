import type { INestApplication } from '@nestjs/common';
import type { DocsPortalBootstrapData } from '@/swagger/interfaces/docs-portal.interface';
import type {
  PortalAssetRoute,
  PortalPageRoute,
} from '../interfaces/portal-route.interface';
import { buildDocsPortalHtmlFromTemplate } from '../templates/docs-portal.html.template';
import { PortalAssetsService } from '../services/portal-assets.service';

type LightweightResponse = {
  type: (value: string) => LightweightResponse;
  send: (body: string) => void;
  setHeader?: (name: string, value: string) => void;
  status?: (code: number) => { end: () => void };
};

function sendCachedAsset(
  res: LightweightResponse,
  contentType: string,
  body: string,
): void {
  res.setHeader?.('Cache-Control', 'public, max-age=3600');
  res.type(contentType).send(body);
}

export function registerDocsPortalRoutes(
  app: INestApplication,
  portalData: DocsPortalBootstrapData,
): void {
  const expressApp = app.getHttpAdapter().getInstance();
  const assets = new PortalAssetsService();
  const htmlTemplate = assets.getPortalHtmlTemplate().body;
  const portalHtml = buildDocsPortalHtmlFromTemplate(htmlTemplate, portalData);

  const assetRoutes: PortalAssetRoute[] = [
    {
      path: '/docs/assets/marked.js',
      contentType: assets.getMarkedJs().contentType,
      load: () => assets.getMarkedJs().body,
    },
    {
      path: '/docs/assets/scalar.js',
      contentType: assets.getScalarJs().contentType,
      load: () => assets.getScalarJs().body,
    },
    {
      path: '/docs/assets/css/docs-portal.css',
      contentType: assets.getPortalCss().contentType,
      load: () => assets.getPortalCss().body,
    },
    {
      path: '/docs/assets/js/docs-portal-utils.js',
      contentType: assets.getPortalUtilsJs().contentType,
      load: () => assets.getPortalUtilsJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-routing.js',
      contentType: assets.getPortalRoutingJs().contentType,
      load: () => assets.getPortalRoutingJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-toc.js',
      contentType: assets.getPortalTocJs().contentType,
      load: () => assets.getPortalTocJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-search.js',
      contentType: assets.getPortalSearchJs().contentType,
      load: () => assets.getPortalSearchJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-endpoint-doc.js',
      contentType: assets.getPortalEndpointDocJs().contentType,
      load: () => assets.getPortalEndpointDocJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-scalar-sync.js',
      contentType: assets.getPortalScalarSyncJs().contentType,
      load: () => assets.getPortalScalarSyncJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-sidebar.js',
      contentType: assets.getPortalSidebarJs().contentType,
      load: () => assets.getPortalSidebarJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-auth.js',
      contentType: assets.getPortalAuthJs().contentType,
      load: () => assets.getPortalAuthJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal-openapi.js',
      contentType: assets.getPortalOpenApiJs().contentType,
      load: () => assets.getPortalOpenApiJs().body,
    },
    {
      path: '/docs/assets/js/docs-portal.js',
      contentType: assets.getPortalJs().contentType,
      load: () => assets.getPortalJs().body,
    },
  ];

  assetRoutes.forEach((route) => {
    expressApp.get(route.path, (_req: unknown, res: LightweightResponse) => {
      sendCachedAsset(res, route.contentType, route.load());
    });
  });

  expressApp.get('/favicon.ico', (_req: unknown, res: LightweightResponse) => {
    res.status?.(204).end();
  });

  // Chrome DevTools probes this path in local environments; returning 204 avoids noisy 404 logs.
  expressApp.get(
    '/.well-known/appspecific/com.chrome.devtools.json',
    (_req: unknown, res: LightweightResponse) => {
      res.status?.(204).end();
    },
  );

  const sendPortalHtml = (_req: unknown, res: LightweightResponse) => {
    res.setHeader?.('Cache-Control', 'public, max-age=60');
    res.type('html').send(portalHtml);
  };

  const portalRoutes: PortalPageRoute[] = [
    { path: '/docs' },
    { path: '/docs/manual/:slug' },
    { path: '/docs/endpoint/:tag/:index' },
    { path: '/docs/api/portal' },
    { path: '/docs/api/endpoint/:tag/:index' },
  ];

  portalRoutes.forEach((route) => {
    expressApp.get(route.path, sendPortalHtml);
  });
}
