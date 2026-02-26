import type { DocsPortalBootstrapData } from '@/swagger/interfaces/docs-portal.interface';

export function serializeDocsPortalBootstrapData(
  data: DocsPortalBootstrapData,
): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
