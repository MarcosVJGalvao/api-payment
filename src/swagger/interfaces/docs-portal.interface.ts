import type { IManualTag } from './manual-tag.interface';

export interface DocsPortalConfig {
  title: string;
  apiSpecUrl: string;
  scalarUrl: string;
}

export interface DocsPortalBootstrapData extends DocsPortalConfig {
  manualTags: IManualTag[];
}
