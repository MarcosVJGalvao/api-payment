import type { DocsPortalBootstrapData } from '@/swagger/interfaces/docs-portal.interface';
import { serializeDocsPortalBootstrapData } from '../serializers/docs-portal.serializer';

export function buildDocsPortalHtmlFromTemplate(
  htmlTemplate: string,
  data: DocsPortalBootstrapData,
): string {
  return htmlTemplate
    .replaceAll('__DOCS_PORTAL_TITLE__', data.title)
    .replace('__DOCS_PORTAL_DATA__', serializeDocsPortalBootstrapData(data));
}
