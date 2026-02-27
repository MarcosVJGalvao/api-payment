export interface PortalAssetRoute {
  path: string;
  contentType: string;
  load: () => string;
}

export interface PortalPageRoute {
  path: string;
}
