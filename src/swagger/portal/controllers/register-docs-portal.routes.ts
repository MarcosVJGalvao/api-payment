import type { INestApplication } from '@nestjs/common';
import type { DocsPortalBootstrapData } from '@/swagger/interfaces/docs-portal.interface';
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

  expressApp.get(
    '/docs/assets/marked.js',
    (_req: unknown, res: LightweightResponse) => {
      const asset = assets.getMarkedJs();
      sendCachedAsset(res, asset.contentType, asset.body);
    },
  );

  expressApp.get(
    '/docs/assets/scalar.js',
    (_req: unknown, res: LightweightResponse) => {
      const asset = assets.getScalarJs();
      sendCachedAsset(res, asset.contentType, asset.body);
    },
  );

  expressApp.get(
    '/docs/assets/css/docs-portal.css',
    (_req: unknown, res: LightweightResponse) => {
      const asset = assets.getPortalCss();
      sendCachedAsset(res, asset.contentType, asset.body);
    },
  );

  expressApp.get(
    '/docs/assets/js/docs-portal.js',
    (_req: unknown, res: LightweightResponse) => {
      const asset = assets.getPortalJs();
      sendCachedAsset(res, asset.contentType, asset.body);
    },
  );

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

  expressApp.get('/docs', sendPortalHtml);
  expressApp.get('/docs/manual/:slug', sendPortalHtml);
  expressApp.get('/docs/endpoint/:tag/:index', sendPortalHtml);
  expressApp.get('/docs/api/portal', sendPortalHtml);
  expressApp.get('/docs/api/endpoint/:tag/:index', sendPortalHtml);
}
