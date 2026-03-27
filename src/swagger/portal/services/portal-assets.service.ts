import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import type {
  AssetContentType,
  CachedAsset,
} from '../interfaces/portal-asset.interface';

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

  getPortalUtilsJs(): CachedAsset {
    return this.getOrLoad(
      'portal:utils-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-utils.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-utils.js'),
        ),
    );
  }

  getPortalRoutingJs(): CachedAsset {
    return this.getOrLoad(
      'portal:routing-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-routing.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-routing.js'),
        ),
    );
  }

  getPortalTocJs(): CachedAsset {
    return this.getOrLoad(
      'portal:toc-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-toc.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-toc.js'),
        ),
    );
  }

  getPortalSearchJs(): CachedAsset {
    return this.getOrLoad(
      'portal:search-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-search.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-search.js'),
        ),
    );
  }

  getPortalEndpointDocJs(): CachedAsset {
    return this.getOrLoad(
      'portal:endpoint-doc-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-endpoint-doc.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-endpoint-doc.js'),
        ),
    );
  }

  getPortalScalarSyncJs(): CachedAsset {
    return this.getOrLoad(
      'portal:scalar-sync-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-scalar-sync.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-scalar-sync.js'),
        ),
    );
  }

  getPortalSidebarJs(): CachedAsset {
    return this.getOrLoad(
      'portal:sidebar-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-sidebar.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-sidebar.js'),
        ),
    );
  }

  getPortalAuthJs(): CachedAsset {
    return this.getOrLoad(
      'portal:auth-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-auth.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-auth.js'),
        ),
    );
  }

  getPortalOpenApiJs(): CachedAsset {
    return this.getOrLoad(
      'portal:openapi-js',
      'application/javascript; charset=utf-8',
      () =>
        this.readProjectAsset(
          join(
            'src',
            'swagger',
            'portal',
            'assets',
            'js',
            'docs-portal-openapi.js',
          ),
          join(__dirname, '..', 'assets', 'js', 'docs-portal-openapi.js'),
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
    const distFromRootPath = join(
      process.cwd(),
      srcRelativePath.replace(/^src[\\/]/, 'dist/'),
    );
    const srcPath = join(process.cwd(), srcRelativePath);

    if (existsSync(distPath)) {
      return readFileSync(distPath, 'utf-8');
    }
    if (existsSync(distFromRootPath)) {
      return readFileSync(distFromRootPath, 'utf-8');
    }
    if (existsSync(srcPath)) {
      return readFileSync(srcPath, 'utf-8');
    }

    // Dev fallback: if source JS was removed and only TS exists,
    // transpile in-memory to keep portal startup resilient.
    if (srcRelativePath.endsWith('.js')) {
      const tsRelativePath = srcRelativePath.replace(/\.js$/, '.ts');
      const tsPath = join(process.cwd(), tsRelativePath);
      if (existsSync(tsPath)) {
        const tsSource = readFileSync(tsPath, 'utf-8');
        return transpileModule(tsSource, {
          compilerOptions: {
            target: ScriptTarget.ES2020,
            module: ModuleKind.None,
            sourceMap: false,
            removeComments: false,
          },
        }).outputText;
      }
    }

    throw new Error(`Docs asset not found in dist or src: ${srcRelativePath}`);
  }

  private stripSourceMapComment(content: string): string {
    return content.replace(/\n\/\/# sourceMappingURL=.*?(?:\r?\n)?$/m, '\n');
  }
}
