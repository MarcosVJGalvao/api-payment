import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type AssetContentType =
  | 'text/css; charset=utf-8'
  | 'application/javascript; charset=utf-8'
  | 'text/html; charset=utf-8';

interface CachedAsset {
  body: string;
  contentType: AssetContentType;
}

export class PortalAssetsService {
  private readonly cache = new Map<string, CachedAsset>();

  getMarkedJs(): CachedAsset {
    return this.getOrLoad(
      'vendor:marked.js',
      'application/javascript; charset=utf-8',
      () =>
        this.stripSourceMapComment(
          readFileSync(
            join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              'node_modules',
              'marked',
              'lib',
              'marked.umd.js',
            ),
            'utf-8',
          ),
        ),
    );
  }

  getScalarJs(): CachedAsset {
    return this.getOrLoad(
      'vendor:scalar.js',
      'application/javascript; charset=utf-8',
      () =>
        this.stripSourceMapComment(
          readFileSync(
            join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              'node_modules',
              '@scalar',
              'api-reference',
              'dist',
              'browser',
              'standalone.js',
            ),
            'utf-8',
          ),
        ),
    );
  }

  getPortalCss(): CachedAsset {
    return this.getOrLoad('portal:css', 'text/css; charset=utf-8', () =>
      this.readProjectAsset(
        join('src', 'swagger', 'portal', 'assets', 'css', 'docs-portal.css'),
        join(__dirname, '..', 'assets', 'css', 'docs-portal.css'),
      ),
    );
  }

  getPortalJs(): CachedAsset {
    return this.getOrLoad(
      'portal:js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join('src', 'swagger', 'portal', 'assets', 'js', 'docs-portal.js'),
          join(__dirname, '..', 'assets', 'js', 'docs-portal.js'),
        ),
    );
  }

  getPortalHtmlTemplate(): CachedAsset {
    return this.getOrLoad(
      'portal:html-template',
      'text/html; charset=utf-8',
      () =>
        this.readProjectAsset(
          join('src', 'swagger', 'portal', 'templates', 'docs-portal.html'),
          join(__dirname, '..', 'templates', 'docs-portal.html'),
        ),
    );
  }

  private getOrLoad(
    key: string,
    contentType: AssetContentType,
    loader: () => string,
  ): CachedAsset {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const asset: CachedAsset = {
      body: loader(),
      contentType,
    };
    this.cache.set(key, asset);
    return asset;
  }

  private readProjectAsset(srcRelativePath: string, distPath: string): string {
    const srcPath = join(process.cwd(), srcRelativePath);
    if (existsSync(distPath)) {
      return readFileSync(distPath, 'utf-8');
    }
    if (existsSync(srcPath)) {
      return readFileSync(srcPath, 'utf-8');
    }
    throw new Error(`Docs asset not found in dist or src: ${srcRelativePath}`);
  }

  private stripSourceMapComment(content: string): string {
    return content.replace(/\n\/\/# sourceMappingURL=.*?(?:\r?\n)?$/m, '\n');
  }
}
