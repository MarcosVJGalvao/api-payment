(function initDocsPortalScalarSyncModule(globalScope) {
  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  interface EndpointDoc {
    method?: string;
    path?: string;
  }

  interface EndpointSelection {
    tag: string;
    index: number;
  }

  type EndpointsByTag = Record<string, EndpointDoc[]>;

  interface ScalarSyncDeps {
    getScalarUrl: () => string;
    getEndpointsByTag: () => EndpointsByTag;
    slugifyEndpointTag: (tag: string) => string;
    getCurrentEndpointSelection: () => EndpointSelection | null;
    getActiveView: () => 'manual' | 'api';
    getScalarLoaded: () => boolean;
    setScalarLoaded: (loaded: boolean) => void;
  }

  function createScalarSyncModule(deps: ScalarSyncDeps) {
    const {
      getScalarUrl,
      getEndpointsByTag,
      slugifyEndpointTag,
      getCurrentEndpointSelection,
      getActiveView,
      getScalarLoaded,
      setScalarLoaded,
    } = deps;

    function getScalarIframe(): HTMLIFrameElement | null {
      return document.getElementById('scalar-iframe') as HTMLIFrameElement | null;
    }

    function getEndpointByTagAndIndex(tag: string, index: number): EndpointDoc | null {
      const endpointsByTag = getEndpointsByTag();
      const endpoints = endpointsByTag && endpointsByTag[tag];
      if (!Array.isArray(endpoints)) return null;
      if (!Number.isInteger(index) || index < 0 || index >= endpoints.length) return null;
      return endpoints[index];
    }

    function getScalarRefFromPortalHash(): string | null {
      const hash = window.location.hash || '';
      if (!hash.startsWith('#scalarRef=')) return null;
      const raw = hash.slice('#scalarRef='.length);
      if (!raw) return null;
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }

    function buildScalarHashForEndpoint(tag: string, index: number): string {
      const endpoint = getEndpointByTagAndIndex(tag, index);
      if (!endpoint) return '';
      const tagSlug = slugifyEndpointTag(tag);
      const method = String(endpoint.method || '').toUpperCase();
      const pathPart = String(endpoint.path || '')
        .replace(/^\/+/, '')
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      if (!tagSlug || !method) return '';
      return '#/tag/' + tagSlug + '/' + method + '/' + pathPart;
    }

    function applyScalarEndpointSelectionToIframe(): void {
      const scalarRefFromHash = getScalarRefFromPortalHash();
      const scalarUrl = getScalarUrl();

      if (scalarRefFromHash) {
        const iframe = getScalarIframe();
        if (!iframe) return;
        const nextSrc = scalarUrl + scalarRefFromHash;
        if (!getScalarLoaded()) {
          iframe.src = nextSrc;
          setScalarLoaded(true);
          return;
        }
        try {
          const loc = iframe.contentWindow && iframe.contentWindow.location;
          const currentRef = loc ? String(loc.search || '') + String(loc.hash || '') : '';
          if (currentRef !== scalarRefFromHash) {
            iframe.src = nextSrc;
          }
        } catch {
          iframe.src = nextSrc;
        }
        return;
      }

      const currentEndpointSelection = getCurrentEndpointSelection();
      if (
        !currentEndpointSelection ||
        !currentEndpointSelection.tag ||
        !Number.isInteger(currentEndpointSelection.index)
      ) {
        return;
      }

      const iframe = getScalarIframe();
      if (!iframe) return;

      const hash = buildScalarHashForEndpoint(
        currentEndpointSelection.tag,
        currentEndpointSelection.index,
      );
      if (!hash) return;

      if (!getScalarLoaded()) {
        iframe.src = scalarUrl + hash;
        setScalarLoaded(true);
        return;
      }

      try {
        if (iframe.contentWindow && iframe.contentWindow.location.hash !== hash) {
          iframe.contentWindow.location.hash = hash;
        }
      } catch {
        iframe.src = scalarUrl + hash;
      }
    }

    function parseScalarSelectionFromIframe(): EndpointSelection | null {
      const iframe = getScalarIframe();
      if (!iframe || !iframe.contentWindow) return null;

      try {
        const loc = iframe.contentWindow.location;
        const hash = String(loc.hash || '');
        const search = String(loc.search || '');
        const endpointsByTag = getEndpointsByTag();

        const tryFindByMethodAndPath = (
          method: string,
          normalizedPath: string | null,
          preferredTagSlug: string | null = null,
        ): EndpointSelection | null => {
          if (!method || !normalizedPath) return null;
          const upperMethod = String(method).toUpperCase();
          for (const [tag, endpoints] of Object.entries(endpointsByTag || {})) {
            if (preferredTagSlug && slugifyEndpointTag(tag) !== preferredTagSlug) continue;
            const index = (endpoints || []).findIndex(
              (ep) =>
                String(ep.method || '').toUpperCase() === upperMethod &&
                String(ep.path || '') === normalizedPath,
            );
            if (index >= 0) return { tag, index };
          }
          return null;
        };

        const normalizeExtractedPath = (value: string | null | undefined): string | null => {
          if (!value) return null;
          let raw = String(value).trim();
          raw = raw.replace(/^[`'"\s]+|[`'",;\s]+$/g, '');
          raw = raw.replace(/^https?:\/\/[^/]+/i, '');
          const hashIndex = raw.indexOf('#');
          if (hashIndex >= 0) raw = raw.slice(0, hashIndex);
          const queryIndex = raw.indexOf('?');
          if (queryIndex >= 0) raw = raw.slice(0, queryIndex);
          if (!raw) return null;
          return raw.startsWith('/') ? raw : '/' + raw;
        };

        const decodePath = (value: string | null | undefined): string | null => {
          if (!value) return null;
          const decoded = String(value)
            .split('/')
            .map((segment) => {
              try {
                return decodeURIComponent(segment);
              } catch {
                return segment;
              }
            })
            .join('/');
          return normalizeExtractedPath(decoded);
        };

        const tryExtractVisibleOperationHeader = (
          iframeDoc: Document,
        ): EndpointSelection | null => {
          const root =
            iframeDoc.querySelector('[role="main"]') || iframeDoc.querySelector('main') || iframeDoc.body;
          if (!root || !root.querySelectorAll) return null;

          const viewportWidth = iframe.contentWindow?.innerWidth || iframe.clientWidth || 0;
          let best: { score: number; selection: EndpointSelection } | null = null;

          const elements = root.querySelectorAll('*');
          for (const el of elements) {
            if (!(el instanceof HTMLElement)) continue;
            if (!el.offsetParent) continue;

            const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
            if (!text || text.length > 240) continue;

            const match = text.match(/\b(GET|POST|PUT|PATCH|DELETE)\b\s+(\/[^\s`'",;)\]]+)/);
            if (!match) continue;

            const rect = el.getBoundingClientRect();
            if (rect.width < 120 || rect.height < 10) continue;
            if (rect.bottom < 0 || rect.top > (iframe.contentWindow?.innerHeight || 10000)) continue;

            const path = normalizeExtractedPath(match[2]);
            if (!path) continue;
            const found = tryFindByMethodAndPath(match[1], path);
            if (!found) continue;

            const inRightPane = viewportWidth ? rect.left > viewportWidth * 0.45 : false;
            const looksLikeHeaderRow = rect.height <= 80;
            const score =
              (inRightPane ? 1000 : 0) -
              (looksLikeHeaderRow ? 0 : 120) -
              Math.max(0, rect.top) -
              Math.max(0, text.length - 80);

            if (!best || score > best.score) {
              best = { score, selection: found };
            }
          }

          return best ? best.selection : null;
        };

        const tryExtractFromVisibleCodeSnippet = (
          iframeDoc: Document,
        ): EndpointSelection | null => {
          const root =
            iframeDoc.querySelector('[role="main"]') || iframeDoc.querySelector('main') || iframeDoc.body;
          if (!root || !root.querySelectorAll) return null;

          const blocks = root.querySelectorAll('pre, code');
          let best: { score: number; selection: EndpointSelection } | null = null;

          for (const el of blocks) {
            if (!(el instanceof HTMLElement)) continue;
            if (!el.offsetParent) continue;

            const rect = el.getBoundingClientRect();
            if (rect.width < 220 || rect.height < 80) continue;
            if (rect.bottom < 0 || rect.top > (iframe.contentWindow?.innerHeight || 10000)) continue;

            const text = String(el.innerText || el.textContent || '');
            if (!text) continue;
            if (!/\bmethod\s*:/.test(text) || !/\burl\s*:/.test(text)) continue;

            const methodMatch = text.match(
              /\bmethod\s*:\s*['"`]?(GET|POST|PUT|PATCH|DELETE)['"`]?/i,
            );
            const urlMatch = text.match(/\burl\s*:\s*['"`]([^'"`\n]+)['"`]/i);
            if (!methodMatch || !urlMatch) continue;

            const found = tryFindByMethodAndPath(methodMatch[1], normalizeExtractedPath(urlMatch[1]));
            if (!found) continue;

            const viewportWidth = iframe.contentWindow?.innerWidth || iframe.clientWidth || 0;
            const inRightPane = viewportWidth ? rect.left > viewportWidth * 0.45 : false;
            const score = (inRightPane ? 1000 : 0) - Math.max(0, rect.top) + Math.min(rect.height, 500);

            if (!best || score > best.score) {
              best = { score, selection: found };
            }
          }

          return best ? best.selection : null;
        };

        let match = hash.match(/^#\/tag\/([^/]+)\/([A-Za-z]+)\/(.+)$/);
        if (match) {
          const preferredTagSlug = decodeURIComponent(match[1] || '');
          const method = match[2];
          const normalizedPath = decodePath(match[3]);
          const found = tryFindByMethodAndPath(method, normalizedPath, preferredTagSlug);
          if (found) return found;
        }

        match = hash.match(/^#(?:\/|\/?operation\/)([A-Za-z]+)\/(.+)$/);
        if (match) {
          const found = tryFindByMethodAndPath(match[1], decodePath(match[2]));
          if (found) return found;
        }

        const params = new URLSearchParams(search);
        const qMethod = params.get('method') || params.get('httpMethod');
        const qPath = params.get('path') || params.get('endpoint') || params.get('route');
        if (qMethod && qPath) {
          const found = tryFindByMethodAndPath(qMethod, decodePath(qPath));
          if (found) return found;
        }

        const iframeDoc = iframe.contentWindow.document;

        const codeSnippetSelection = tryExtractFromVisibleCodeSnippet(iframeDoc);
        if (codeSnippetSelection) return codeSnippetSelection;

        const visibleHeaderSelection = tryExtractVisibleOperationHeader(iframeDoc);
        if (visibleHeaderSelection) return visibleHeaderSelection;

        const focusedText =
          (iframeDoc.querySelector('main') as HTMLElement | null)?.innerText ||
          (iframeDoc.querySelector('[role="main"]') as HTMLElement | null)?.innerText ||
          iframeDoc.body?.innerText ||
          '';

        const endpointPattern =
          /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s`'",;)\]]+|https?:\/\/[^\s`'",;)\]]+)/g;
        const endpointCandidates: EndpointSelection[] = [];
        let endpointMatch: RegExpExecArray | null;
        while ((endpointMatch = endpointPattern.exec(focusedText)) != null) {
          const normalizedPath = normalizeExtractedPath(endpointMatch[2]);
          const found = tryFindByMethodAndPath(endpointMatch[1], normalizedPath);
          if (found) endpointCandidates.push(found);
        }
        if (endpointCandidates.length) {
          return endpointCandidates[endpointCandidates.length - 1];
        }

        const urlPattern = /\burl\s*[:=]\s*[`'"](https?:\/\/[^`'"]+|\/[^`'"]+)/gi;
        let urlMatch: RegExpExecArray | null;
        while ((urlMatch = urlPattern.exec(focusedText)) != null) {
          const normalizedPath = normalizeExtractedPath(urlMatch[1]);
          if (!normalizedPath) continue;

          const windowStart = Math.max(0, urlMatch.index - 240);
          const localChunk = focusedText.slice(windowStart, urlMatch.index + 80);
          const localMethodMatches = Array.from(
            localChunk.matchAll(/\bmethod\s*:\s*['"]?(GET|POST|PUT|PATCH|DELETE)['"]?/gi),
          );
          const localMethods = localMethodMatches.map((m: RegExpMatchArray) => String(m[1]).toUpperCase() as HttpMethod);
          const methodHints: string[] = localMethods.length
            ? localMethods.reverse()
            : focusedText.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/g) || [];

          for (const hint of methodHints) {
            const found = tryFindByMethodAndPath(hint, normalizedPath);
            if (found) return found;
          }
        }
      } catch {
        return null;
      }

      return null;
    }

    function syncApiPortalUrlFromScalarSelection(): void {
      if (getActiveView() !== 'api') return;
      const iframe = getScalarIframe();
      if (!iframe || !iframe.contentWindow) return;

      try {
        const loc = iframe.contentWindow.location;
        const scalarRef = String(loc.search || '') + String(loc.hash || '');
        const portalPath = window.location.pathname || '/docs/api/portal';
        const encodedRef = scalarRef
          ? '#scalarRef=' + encodeURI(scalarRef).replace(/\?/g, '%3F').replace(/#/g, '%23')
          : '';
        const nextUrl = portalPath + (window.location.search || '') + encodedRef;
        const currentUrl =
          window.location.pathname + (window.location.search || '') + (window.location.hash || '');
        if (currentUrl !== nextUrl) {
          window.history.replaceState({}, '', nextUrl);
        }
        return;
      } catch {
        // Fallback to endpoint inference below.
      }

      const selection = parseScalarSelectionFromIframe();
      if (!selection) return;

      const nextPath =
        '/docs/api/endpoint/' + slugifyEndpointTag(selection.tag) + '/' + selection.index;
      const nextUrl = nextPath + (window.location.search || '');
      if (window.location.pathname !== nextPath || window.location.hash) {
        window.history.replaceState({}, '', nextUrl);
      }
    }

    return {
      applyScalarEndpointSelectionToIframe,
      buildScalarHashForEndpoint,
      getScalarRefFromPortalHash,
      parseScalarSelectionFromIframe,
      syncApiPortalUrlFromScalarSelection,
    };
  }

  globalScope.DocsPortalScalarSync = {
    createScalarSyncModule,
  };
})(window);
