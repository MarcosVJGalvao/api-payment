import { readFileSync } from 'fs';
import { join } from 'path';
import type { IManualTag } from '../interfaces/manual-tag.interface';
import { buildDocsPortalHtmlFromTemplate } from '../portal/templates/docs-portal.html.template';

interface IDocsPortalConfig {
  title: string;
  apiSpecUrl: string;
  scalarUrl: string;
}

export function buildDocsPortalHtml(
  config: IDocsPortalConfig,
  manualTags: IManualTag[],
): string {
  const htmlTemplate = readFileSync(
    join(__dirname, '..', 'portal', 'templates', 'docs-portal.html'),
    'utf-8',
  );

  return buildDocsPortalHtmlFromTemplate(htmlTemplate, {
    ...config,
    manualTags,
  });
}
