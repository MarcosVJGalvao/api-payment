export type AssetContentType =
  | 'text/css; charset=utf-8'
  | 'application/javascript; charset=utf-8'
  | 'text/html; charset=utf-8';

export interface CachedAsset {
  body: string;
  contentType: AssetContentType;
}
