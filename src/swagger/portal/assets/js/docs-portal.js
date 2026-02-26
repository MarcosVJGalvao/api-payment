    const portalDataScript = document.getElementById('docs-portal-data');
    const portalData = portalDataScript
      ? JSON.parse(portalDataScript.textContent || '{}')
      : {};
    const manualTags = Array.isArray(portalData.manualTags)
      ? portalData.manualTags
      : [];
    const scalarUrl = typeof portalData.scalarUrl === 'string'
      ? portalData.scalarUrl
      : '/docs/api';
    const apiSpecUrl = typeof portalData.apiSpecUrl === 'string'
      ? portalData.apiSpecUrl
      : '/api/openapi.json';

    let activeView = 'manual';
    let scalarLoaded = false;
    let scalarReady = false;
    let searchSelectedIndex = 0;
    let openApiSpec = null;
    let endpointsByTag = {};
    let allSearchItems = [];
    let manualTocItems = [];
    let currentEndpointSelection = null;
    let currentManualSelection = null;

    function isMobileLayout() {
      return window.matchMedia('(max-width: 820px)').matches;
    }

    function syncNavbarOffset() {
      const navbar = document.querySelector('.navbar');
      if (!navbar) return;
      const height = Math.ceil(navbar.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--navbar-offset', height + 'px');
    }

    function toggleManualSidebar() {
      if (!isMobileLayout()) return;
      const manualView = document.getElementById('manual-view');
      const backdrop = document.getElementById('manual-sidebar-backdrop');
      const isOpen = manualView.classList.toggle('sidebar-open');
      backdrop.classList.toggle('active', isOpen);
    }

    function closeManualSidebar() {
      const manualView = document.getElementById('manual-view');
      const backdrop = document.getElementById('manual-sidebar-backdrop');
      manualView.classList.remove('sidebar-open');
      backdrop.classList.remove('active');
    }

    function navigateToManualByName(name) {
      const index = manualTags.findIndex((t) => t && t.name === name);
      if (index >= 0) {
        if (activeView !== 'manual') switchView('manual');
        selectManualItem(index);
        return true;
      }
      return false;
    }

    function slugifyManualName(name) {
      return slugifyHeading(name);
    }

    function navigateToManualBySlug(slug) {
      const index = manualTags.findIndex(
        (t) => t && slugifyManualName(t.name) === slug,
      );
      if (index >= 0) {
        if (activeView !== 'manual') switchView('manual');
        selectManualItem(index);
        return true;
      }
      return false;
    }

    function getManualSlugFromPath() {
      const path = window.location.pathname || '';
      const match = path.match(/^\/docs\/manual\/([^/]+)$/);
      return match ? decodeURIComponent(match[1]) : null;
    }

    function slugifyEndpointTag(tag) {
      return slugifyHeading(tag);
    }

    function getEndpointRouteFromPath() {
      const path = window.location.pathname || '';
      const match = path.match(/^\/docs\/endpoint\/([^/]+)\/(\d+)$/);
      if (!match) return null;
      return {
        tagSlug: decodeURIComponent(match[1]),
        index: Number(match[2]),
      };
    }

    function getApiPortalRouteFromPath() {
      const path = window.location.pathname || '';

      const endpointMatch = path.match(/^\/docs\/api\/endpoint\/([^/]+)\/(\d+)$/);
      if (endpointMatch) {
        return {
          type: 'endpoint',
          tagSlug: decodeURIComponent(endpointMatch[1]),
          index: Number(endpointMatch[2]),
        };
      }

      if (path === '/docs/api/portal') {
        return { type: 'portal' };
      }

      return null;
    }

    function setManualUrl(slug) {
      const nextPath = '/docs/manual/' + slug;
      const nextUrl = nextPath + (window.location.search || '');
      if (window.location.pathname === nextPath) return;
      window.history.replaceState({}, '', nextUrl);
    }

    function setEndpointUrl(tag, index) {
      const nextPath = '/docs/endpoint/' + slugifyEndpointTag(tag) + '/' + index;
      const nextUrl = nextPath + (window.location.search || '');
      if (window.location.pathname === nextPath) return;
      window.history.replaceState({}, '', nextUrl);
    }

    function syncManualUrl() {
      if (
        currentManualSelection &&
        currentManualSelection.type === 'endpoint' &&
        currentManualSelection.tag &&
        Number.isInteger(currentManualSelection.index)
      ) {
        setEndpointUrl(currentManualSelection.tag, currentManualSelection.index);
        return;
      }

      if (
        currentManualSelection &&
        currentManualSelection.type === 'manual' &&
        currentManualSelection.slug
      ) {
        setManualUrl(currentManualSelection.slug);
        return;
      }

      const firstManual = manualTags[0];
      if (firstManual && firstManual.name) {
        setManualUrl(slugifyManualName(firstManual.name));
      }
    }

    function ensureManualContentRendered() {
      if (
        currentManualSelection &&
        currentManualSelection.type === 'endpoint' &&
        currentManualSelection.tag &&
        Number.isInteger(currentManualSelection.index)
      ) {
        selectEndpoint(currentManualSelection.tag, currentManualSelection.index);
        return;
      }

      if (
        currentManualSelection &&
        currentManualSelection.type === 'manual' &&
        Number.isInteger(currentManualSelection.index)
      ) {
        selectManualItem(currentManualSelection.index);
        return;
      }

      if (manualTags.length > 0) {
        selectManualItem(0);
      }
    }

    function setApiUrl() {
      let nextPath = '/docs/api/portal';
      if (
        currentEndpointSelection &&
        currentEndpointSelection.tag &&
        Number.isInteger(currentEndpointSelection.index)
      ) {
        nextPath =
          '/docs/api/endpoint/' +
          slugifyEndpointTag(currentEndpointSelection.tag) +
          '/' +
          currentEndpointSelection.index;
      }
      const nextUrl = nextPath + (window.location.search || '');
      if (window.location.pathname === nextPath) return;
      window.history.replaceState({}, '', nextUrl);
    }

    function applyRouteFromHash() {
      const hash = window.location.hash || '';
      if (!hash.startsWith('#manual=')) return false;
      const value = decodeURIComponent(hash.replace('#manual=', ''));
      return navigateToManualBySlug(value) || navigateToManualByName(value);
    }

    function applyRouteFromPath() {
      const apiRoute = getApiPortalRouteFromPath();
      if (apiRoute) {
        if (apiRoute.type === 'portal') {
          if (activeView !== 'api') switchView('api');
          return true;
        }

        if (
          apiRoute.type === 'endpoint' &&
          apiRoute.tagSlug &&
          Number.isInteger(apiRoute.index)
        ) {
          const match = Object.entries(endpointsByTag || {}).find(
            ([tag]) => slugifyEndpointTag(tag) === apiRoute.tagSlug,
          );
          if (match) {
            const [tag, eps] = match;
            if (apiRoute.index >= 0 && apiRoute.index < (eps || []).length) {
              selectEndpoint(tag, apiRoute.index);
              if (activeView !== 'api') switchView('api');
              return true;
            }
          }
          if (activeView !== 'api') switchView('api');
          return true;
        }
      }

      const endpointRoute = getEndpointRouteFromPath();
      if (endpointRoute && endpointRoute.tagSlug && Number.isInteger(endpointRoute.index)) {
        const match = Object.entries(endpointsByTag || {}).find(
          ([tag]) => slugifyEndpointTag(tag) === endpointRoute.tagSlug,
        );
        if (match) {
          const [tag, eps] = match;
          if (endpointRoute.index >= 0 && endpointRoute.index < (eps || []).length) {
            if (activeView !== 'manual') switchView('manual');
            selectEndpoint(tag, endpointRoute.index);
            return true;
          }
        }
      }

      const slug = getManualSlugFromPath();
      if (!slug) return false;
      return navigateToManualBySlug(slug);
    }

    function slugifyHeading(text) {
      return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }

    function buildManualToc() {
      const content = document.getElementById('manual-content');
      const tocList = document.getElementById('manual-toc-list');
      if (!content || !tocList) return;

      const allHeadings = Array.from(
        content.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4'),
      );
      const hasNonH1Heading = allHeadings.some(
        (el) => (el.tagName || '').toLowerCase() !== 'h1',
      );
      const headings = hasNonH1Heading
        ? allHeadings.filter((el) => (el.tagName || '').toLowerCase() !== 'h1')
        : allHeadings;

      const tocCandidates = [];
      const usedIds = new Set();
      let firstLevel = null;

      headings.forEach((el, idx) => {
        const tag = (el.tagName || '').toLowerCase();
        const rawLevel = Number(tag.replace('h', '')) || 2;
        const text = (el.textContent || '').trim();
        if (!text) return;

        if (el.classList.contains('endpoint-path')) return;

        if (!el.id) {
          let base = slugifyHeading(text) || ('section-' + idx);
          let finalId = base;
          let seq = 2;
          while (usedIds.has(finalId) || document.getElementById(finalId)) {
            finalId = base + '-' + seq++;
          }
          el.id = finalId;
          usedIds.add(finalId);
        } else {
          usedIds.add(el.id);
        }

        if (firstLevel === null) firstLevel = rawLevel;
        const visualLevel = rawLevel <= firstLevel ? 1 : 2;
        tocCandidates.push({ id: el.id, text, level: visualLevel, el });
      });

      manualTocItems = tocCandidates;
      if (!manualTocItems.length) {
        tocList.innerHTML = '<div class="manual-toc-empty">Sem tópicos</div>';
        return;
      }

      tocList.innerHTML = manualTocItems
        .map((item, i) =>
          '<button type="button" class="manual-toc-item level-' + item.level + '" data-toc-index="' + i + '" title="' + escapeHtml(item.text) + '">' +
            escapeHtml(item.text) +
          '</button>',
        )
        .join('');

      tocList.querySelectorAll('.manual-toc-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.tocIndex);
          const item = manualTocItems[idx];
          if (!item) return;
          item.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveTocItem(idx);
        });
      });

      bindManualTocScrollSpy();
      updateManualTocActive();
    }

    function setActiveTocItem(index) {
      const tocList = document.getElementById('manual-toc-list');
      if (!tocList) return;
      tocList.querySelectorAll('.manual-toc-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
    }

    function updateManualTocActive() {
      const content = document.getElementById('manual-content');
      if (!content || !manualTocItems.length) return;

      const contentRect = content.getBoundingClientRect();
      const anchorLine = contentRect.top + 40;
      let activeIndex = 0;

      manualTocItems.forEach((item, i) => {
        const rect = item.el.getBoundingClientRect();
        if (rect.top <= anchorLine) activeIndex = i;
      });

      setActiveTocItem(activeIndex);
    }

    function bindManualTocScrollSpy() {
      const content = document.getElementById('manual-content');
      if (!content || content.dataset.tocSpyBound === 'true') return;
      content.addEventListener('scroll', () => {
        if (activeView === 'manual') updateManualTocActive();
      });
      content.dataset.tocSpyBound = 'true';
    }

    function renderManualHtml(html) {
      const content = document.getElementById('manual-content');
      content.innerHTML = '<div class="markdown-body">' + html + '</div>';
      content.scrollTop = 0;
      buildManualToc();
    }

    // ── Init ─────────────────────────────────────
    async function init() {
      syncNavbarOffset();
      const scalarIframe = document.getElementById('scalar-iframe');
      scalarIframe.addEventListener('load', () => {
        scalarReady = true;
        document.getElementById('api-view').classList.add('loaded');
      });
      renderSidebar();
      if (!applyRouteFromPath() && !applyRouteFromHash() && manualTags.length > 0) {
        selectManualItem(0);
      }
      await loadOpenApiSpec();
      applyRouteFromPath() || applyRouteFromHash();
    }

    // ── Load OpenAPI spec ────────────────────────
    async function loadOpenApiSpec() {
      try {
        const res = await fetch(apiSpecUrl);
        openApiSpec = await res.json();
        endpointsByTag = groupEndpointsByTag(openApiSpec);
        renderApiGroups();
        buildSearchIndex();
      } catch (e) {
        console.error('Failed to load OpenAPI spec:', e);
      }
    }

    function groupEndpointsByTag(spec) {
      const groups = {};
      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [method, op] of Object.entries(methods)) {
          if (!op || !op.tags) continue;
          for (const tag of op.tags) {
            if (!groups[tag]) groups[tag] = [];
            groups[tag].push({ method: method.toUpperCase(), path, ...op });
          }
        }
      }
      return groups;
    }

    function getEndpointAuthKeys(ep) {
      if (!ep || !Array.isArray(ep.security)) return [];
      const keys = new Set();
      ep.security.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        Object.keys(entry).forEach((key) => keys.add(key));
      });
      return Array.from(keys);
    }

    function getPrimaryAuthKey(ep) {
      const keys = getEndpointAuthKeys(ep);
      if (!keys.length) return 'public';
      const preferred = ['backoffice-auth', 'internal-auth', 'provider-auth'];
      const match = preferred.find((k) => keys.includes(k));
      return match || keys[0];
    }

    function getAuthGroupMeta(authKey) {
      const map = {
        'backoffice-auth': { label: 'Backoffice', order: 1 },
        'internal-auth': { label: 'Internal', order: 2 },
        'provider-auth': { label: 'Provider', order: 3 },
        public: { label: 'Público', order: 4 },
      };
      return map[authKey] || { label: authKey, order: 99 };
    }

    function getAuthLabelForEndpoint(ep) {
      const keys = getEndpointAuthKeys(ep);
      if (!keys.length) return 'Sem autenticação';
      const labels = keys.map((k) => getAuthGroupMeta(k).label);
      return labels.join(' / ');
    }

    function getSecurityScheme(authKey) {
      const schemes = openApiSpec && openApiSpec.components && openApiSpec.components.securitySchemes;
      return schemes && schemes[authKey] ? schemes[authKey] : null;
    }

    function getRequiredHeadersForEndpoint(ep) {
      const headers = [];
      const seen = new Set();

      const pushHeader = (name, source, required, description) => {
        const key = String(name).toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        headers.push({ name, source, required, description });
      };

      getEndpointAuthKeys(ep).forEach((authKey) => {
        const scheme = getSecurityScheme(authKey);
        if (!scheme) return;

        if (scheme.type === 'http' && scheme.scheme === 'bearer') {
          pushHeader(
            'Authorization',
            'auth',
            true,
            'Bearer <token> (' + getAuthGroupMeta(authKey).label + ')',
          );
          return;
        }

        if (scheme.type === 'apiKey' && scheme.in === 'header' && scheme.name) {
          pushHeader(
            scheme.name,
            'auth',
            true,
            scheme.description || ('Header de autenticação (' + getAuthGroupMeta(authKey).label + ')'),
          );
        }
      });

      (ep.parameters || []).forEach((p) => {
        if (!p || p.in !== 'header') return;
        pushHeader(
          p.name,
          'parameter',
          Boolean(p.required),
          p.description || 'Header da requisição',
        );
      });

      return headers;
    }

    function renderRequiredHeadersBox(ep) {
      const headers = getRequiredHeadersForEndpoint(ep);
      let html = '<h2>Headers Necess\u00e1rios</h2>';
      if (!headers.length) {
        html += '<p>N\u00e3o \u00e9 necess\u00e1rio enviar headers adicionais nesta requisi\u00e7\u00e3o.</p>';
        return html;
      }
      html += '<table><thead><tr><th>Nome</th><th>Obrigat\u00f3rio</th><th>Descri\u00e7\u00e3o</th></tr></thead><tbody>';
      headers.forEach((h) => {
        html += '<tr>';
        html += '<td><code>' + escapeHtml(h.name) + '</code></td>';
        html += '<td>' + (h.required ? 'Sim' : 'N\u00e3o') + '</td>';
        html += '<td>' + escapeHtml(h.description || 'Header da requisi\u00e7\u00e3o') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      return html;
    }

    function groupTagsByAuth() {
      const authGroups = {};
      Object.entries(endpointsByTag).forEach(([tag, endpoints]) => {
        const authKey = getPrimaryAuthKey(endpoints[0]);
        if (!authGroups[authKey]) authGroups[authKey] = [];
        authGroups[authKey].push({ tag, endpoints });
      });

      return Object.entries(authGroups)
        .sort((a, b) => {
          const am = getAuthGroupMeta(a[0]);
          const bm = getAuthGroupMeta(b[0]);
          if (am.order !== bm.order) return am.order - bm.order;
          return am.label.localeCompare(bm.label);
        })
        .map(([authKey, groups]) => ({
          authKey,
          ...getAuthGroupMeta(authKey),
          groups: groups.sort((a, b) => a.tag.localeCompare(b.tag)),
        }));
    }

    // ── Helpers: manual tags linked to API tags ──
    function getStandaloneManuals() {
      return manualTags.filter(t => !t.apiTag);
    }

    function getLinkedManual(apiTag) {
      return manualTags.find(t => t.apiTag === apiTag) || null;
    }

    // ── Sidebar ──────────────────────────────────
    function renderSidebar() {
      const sidebar = document.getElementById('manual-sidebar');
      sidebar.innerHTML = '';

      // Standalone manual section (without apiTag)
      const standalones = getStandaloneManuals();
      if (standalones.length > 0) {
        const title = document.createElement('div');
        title.className = 'sidebar-section-title';
        title.textContent = 'Documenta\u00e7\u00e3o';
        sidebar.appendChild(title);

        standalones.forEach((tag, i) => {
          const item = document.createElement('div');
          item.className = 'sidebar-item' + (i === 0 ? ' active' : '');
          item.textContent = tag.name;
          item.dataset.type = 'manual';
          item.dataset.index = String(manualTags.indexOf(tag));
          item.onclick = () => selectManualItem(manualTags.indexOf(tag));
          sidebar.appendChild(item);
        });
      }
    }

    function renderApiGroups() {
      const sidebar = document.getElementById('manual-sidebar');

      const title = document.createElement('div');
      title.className = 'sidebar-section-title';
      title.style.marginTop = '12px';
      title.textContent = 'Endpoints';
      sidebar.appendChild(title);

      groupTagsByAuth().forEach((authBlock) => {
        const authContainer = document.createElement('div');
        authContainer.className = 'sidebar-auth-group';

        const authTitle = document.createElement('div');
        authTitle.className = 'sidebar-auth-title';
        authTitle.textContent = authBlock.label;
        authContainer.appendChild(authTitle);

        authBlock.groups.forEach(({ tag, endpoints }) => {
          const linked = getLinkedManual(tag);
          const group = document.createElement('div');
          group.className = 'sidebar-group';

          const header = document.createElement('div');
          header.className = 'sidebar-group-header';
          header.innerHTML = '<span>' + escapeHtml(tag) + '</span><span class="arrow">\u25B6</span>';
          header.onclick = () => group.classList.toggle('open');

          const items = document.createElement('div');
          items.className = 'sidebar-group-items';

          if (linked) {
            const overview = document.createElement('div');
            overview.className = 'sidebar-endpoint';
            overview.innerHTML = '<span style="font-size:12px">\ud83d\udcd6</span> Vis\u00e3o Geral';
            overview.onclick = (e) => { e.stopPropagation(); selectGroupOverview(tag); };
            items.appendChild(overview);
          }

          endpoints.forEach((ep, i) => {
            const item = document.createElement('div');
            item.className = 'sidebar-endpoint';
            item.innerHTML = '<span class="method-badge method-' + ep.method + '">' + ep.method + '</span> ' + escapeHtml(ep.summary || ep.path);
            item.onclick = (e) => { e.stopPropagation(); selectEndpoint(tag, i); };
            items.appendChild(item);
          });

          group.appendChild(header);
          group.appendChild(items);
          authContainer.appendChild(group);
        });

        sidebar.appendChild(authContainer);
      });
    }

    // ── Selection ────────────────────────────────
    function clearActive() {
      document.querySelectorAll('.sidebar-item.active, .sidebar-endpoint.active').forEach(el => el.classList.remove('active'));
    }

    function selectManualItem(index) {
      currentEndpointSelection = null;
      closeManualSidebar();
      clearActive();
      const items = document.querySelectorAll('.sidebar-item[data-type="manual"]');
      if (items[index]) items[index].classList.add('active');

      const content = document.getElementById('manual-content');
      const tag = manualTags[index];
      if (tag) {
        const slug = slugifyManualName(tag.name);
        currentManualSelection = { type: 'manual', slug, index };
        setManualUrl(slug);
        renderManualHtml(marked.parse(tag.description));
      }
    }

    function selectEndpoint(tag, index) {
      currentEndpointSelection = { tag, index };
      currentManualSelection = { type: 'endpoint', tag, index };
      closeManualSidebar();
      clearActive();
      const linked = getLinkedManual(tag);
      const offset = linked ? 1 : 0; // offset for the "Vis\u00e3o Geral" item

      const groups = document.querySelectorAll('.sidebar-group');
      groups.forEach(g => {
        const headerText = g.querySelector('.sidebar-group-header span').textContent;
        if (headerText === tag) {
          g.classList.add('open');
          const endpoints = g.querySelectorAll('.sidebar-endpoint');
          if (endpoints[index + offset]) endpoints[index + offset].classList.add('active');
        }
      });

      const ep = endpointsByTag[tag][index];
      setEndpointUrl(tag, index);
      renderManualHtml(buildEndpointDoc(ep, tag));
    }

    function selectGroupOverview(tag) {
      currentEndpointSelection = null;
      closeManualSidebar();
      clearActive();
      const groups = document.querySelectorAll('.sidebar-group');
      groups.forEach(g => {
        const headerText = g.querySelector('.sidebar-group-header span').textContent;
        if (headerText === tag) {
          g.classList.add('open');
          const endpoints = g.querySelectorAll('.sidebar-endpoint');
          if (endpoints[0]) endpoints[0].classList.add('active');
        }
      });

      const linked = getLinkedManual(tag);
      if (linked && linked.name) {
        currentManualSelection = {
          type: 'manual',
          slug: slugifyManualName(linked.name),
          tag,
        };
      } else {
        currentManualSelection = null;
      }
      let html = '';
      if (linked) {
        html += marked.parse(linked.description);
        html += '<hr>';
      }
      // Show a summary of all endpoints in this group
      const endpoints = endpointsByTag[tag] || [];
      html += '<h2>Endpoints</h2>';
      html += '<table><thead><tr><th>M\u00e9todo</th><th>Rota</th><th>Descri\u00e7\u00e3o</th></tr></thead><tbody>';
      endpoints.forEach((ep, i) => {
        html += '<tr class="endpoint-row" data-tag="' + escapeHtml(tag) + '" data-idx="' + i + '" style="cursor:pointer">';
        html += '<td><span class="method-badge method-' + ep.method + '">' + ep.method + '</span></td>';
        html += '<td><code>' + escapeHtml(ep.path) + '</code></td>';
        html += '<td>' + escapeHtml(ep.summary || ep.description || '\u2014') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';

      renderManualHtml(html);

      const content = document.getElementById('manual-content');

      // Bind click events via delegation
      content.querySelectorAll('.endpoint-row').forEach(row => {
        row.addEventListener('click', () => {
          selectEndpoint(row.dataset.tag, parseInt(row.dataset.idx, 10));
        });
      });
    }

    // ── Endpoint doc builder ─────────────────────
    function buildEndpointDoc(ep, tag) {
      let md = '';

      md += '<h1>' + escapeHtml(ep.summary || tag) + '</h1>';

      if (ep.description) {
        md += marked.parse(ep.description);
      }

      // Endpoint method/path below title+description, above auth
      md += '<div class="endpoint-header">';
      md += '<span class="endpoint-method-badge method-' + ep.method + '">' + ep.method + '</span>';
      md += '<span class="endpoint-path">' + escapeHtml(ep.path) + '</span>';
      md += '</div>';

      md += '<div class="auth-chip">🔐 Autenticação: ' + escapeHtml(getAuthLabelForEndpoint(ep)) + '</div>';

      md += renderRequiredHeadersBox(ep);

      // Parameters (query/path only; headers are shown in "Headers Necessários")
      const routeParams = (ep.parameters || []).filter((p) => p && (p.in === 'query' || p.in === 'path'));
      md += '<h2>Parâmetros</h2>';
      if (routeParams.length > 0) {
        md += '<table><thead><tr><th>Nome</th><th>Em</th><th>Tipo</th><th>Obrigatório</th><th>Descrição</th></tr></thead><tbody>';
        routeParams.forEach(p => {
          const type = p.schema ? (p.schema.type || p.schema.enum ? 'enum' : '—') : '—';
          const enumVals = p.schema && p.schema.enum
            ? ' <span class="enum-value-list">(' + p.schema.enum.map(v => escapeHtml(String(v))).join(',<wbr> ') + ')</span>'
            : '';
          md += '<tr>';
          md += '<td><code>' + escapeHtml(p.name) + '</code></td>';
          md += '<td>' + escapeHtml(p.in) + '</td>';
          md += '<td>' + escapeHtml(type) + enumVals + '</td>';
          md += '<td>' + (p.required ? 'Sim' : 'Não') + '</td>';
          md += '<td>' + escapeHtml(p.description || '—') + '</td>';
          md += '</tr>';
        });
        md += '</tbody></table>';
      } else {
        md += '<p>N\u00e3o \u00e9 necess\u00e1rio enviar par\u00e2metros nesta requisi\u00e7\u00e3o.</p>';
      }

      // Request Body
      md += '<h2>Corpo da Requisição</h2>';
      if (ep.requestBody) {
        const content = ep.requestBody.content;
        if (content && content['application/json']) {
          const jsonContent = content['application/json'];
          const schema = resolveSchema(jsonContent.schema);
          if (schema && schema.properties) {
            md += renderSchemaTable(schema, { showRequired: false });
          }
          // Examples
          if (jsonContent.examples) {
            md += '<h3>Exemplos</h3>';
            for (const [name, example] of Object.entries(jsonContent.examples)) {
              md += '<h4>' + escapeHtml(name) + '</h4>';
              md += '<pre><code>' + escapeHtml(JSON.stringify(example.value, null, 2)) + '</code></pre>';
            }
          }
        } else {
          md += '<p>Esta requisi\u00e7\u00e3o n\u00e3o possui corpo em <code>application/json</code>.</p>';
        }
      } else {
        md += '<p>N\u00e3o \u00e9 necess\u00e1rio enviar body nesta requisi\u00e7\u00e3o.</p>';
      }

      // Responses (success + errors separated)
      if (ep.responses) {
        const responseEntries = Object.entries(ep.responses);
        const successResponses = responseEntries.filter(([status]) => String(status).startsWith('2'));
        const errorResponses = responseEntries.filter(([status]) => !String(status).startsWith('2'));

        if (successResponses.length > 0) {
          const [status, resp] = successResponses[0];
          const jsonResp = getResponseJsonContent(resp);
          const schema = jsonResp ? resolveSchema(jsonResp.schema) : null;

          md += '<h2>Resposta</h2>';
          md += '<p>Quando a requisição retornar sucesso, a API irá retornar <strong>statusCode ' + escapeHtml(String(status)) + '</strong>';
          if (resp && resp.description) {
            md += ' (' + escapeHtml(String(resp.description)) + ')';
          }
          md += schema && schema.properties
            ? ' e um objeto no formato abaixo:</p>'
            : '.</p>';

          if (schema && schema.properties) {
            md += renderSchemaTable(schema);
          }

          const successExamples = getSuccessExamples(jsonResp);
          if (successExamples.length > 0) {
            md += '<h3>Exemplos de sucesso</h3>';
            successExamples.forEach((example) => {
              md += '<details><summary>' + escapeHtml(example.name) + '</summary>';
              md += '<pre><code>' + escapeHtml(JSON.stringify(example.value, null, 2)) + '</code></pre>';
              md += '</details>';
            });
          }
        } else {
          md += '<h2>Resposta</h2>';
          md += '<p>N\u00e3o h\u00e1 resposta de sucesso documentada para este endpoint.</p>';
        }

        if (errorResponses.length > 0) {
          md += '<h2>Erros</h2>';
          md += '<p>Este endpoint pode retornar erros específicos, conforme a tabela a seguir:</p>';
          if (errorResponses.some(([status]) => String(status) === '400')) {
            md += '<p>Recordamos que esta API também poderá retornar erros comuns entre todos os endpoints que acompanham os erros <strong>400</strong> (se houver). Consulte a seção <a href="/docs#manual=tratamento-de-erros">Padrões de Erros</a>.</p>';
          }
          md += '<table><thead><tr><th>StatusCode</th><th>ErrorCode</th><th>Message</th><th>Descri\u00e7\u00e3o</th></tr></thead><tbody>';

          errorResponses.forEach(([status, resp]) => {
            const errorSummary = extractErrorSummary(resp);
            md += '<tr>';
            md += '<td>' + escapeHtml(String(status)) + '</td>';
            md += '<td><code>' + escapeHtml(errorSummary.errorCode) + '</code></td>';
            md += '<td>' + escapeHtml(errorSummary.message) + '</td>';
            md += '<td>' + escapeHtml(errorSummary.description) + '</td>';
            md += '</tr>';
          });

          md += '</tbody></table>';
        } else {
          md += '<h2>Erros</h2>';
          md += '<p>N\u00e3o h\u00e1 erros espec\u00edficos documentados para este endpoint.</p>';
        }
      } else {
        md += '<h2>Resposta</h2>';
        md += '<p>N\u00e3o h\u00e1 resposta de sucesso documentada para este endpoint.</p>';
        md += '<h2>Erros</h2>';
        md += '<p>N\u00e3o h\u00e1 erros documentados para este endpoint.</p>';
      }

      return md;
    }

    // ── Schema helpers ───────────────────────────
    function resolveSchema(schema) {
      if (!schema) return null;
      if (schema.$ref) {
        const refPath = schema.$ref.replace('#/components/schemas/', '');
        return (openApiSpec.components && openApiSpec.components.schemas && openApiSpec.components.schemas[refPath]) || null;
      }
      return schema;
    }

    function getResponseJsonContent(resp) {
      if (!resp || !resp.content) return null;
      return resp.content['application/json'] || null;
    }

    function getExampleValuesFromContent(jsonContent) {
      if (!jsonContent) return [];
      if (jsonContent.examples && typeof jsonContent.examples === 'object') {
        return Object.values(jsonContent.examples)
          .map((ex) => (ex && typeof ex === 'object' ? ex.value : null))
          .filter(Boolean);
      }
      if (jsonContent.example) return [jsonContent.example];
      return [];
    }

    function getSuccessExamples(jsonResp) {
      if (!jsonResp) return [];

      if (jsonResp.examples && typeof jsonResp.examples === 'object') {
        return Object.entries(jsonResp.examples)
          .map(([name, ex]) => ({
            name,
            value: ex && typeof ex === 'object' ? ex.value : null,
          }))
          .filter((item) => item.value != null);
      }

      if (jsonResp.example != null) {
        return [{ name: 'success', value: jsonResp.example }];
      }

      const schema = resolveSchema(jsonResp.schema);
      if (schema && schema.example != null) {
        return [{ name: 'success', value: schema.example }];
      }

      if (schema) {
        const generated = generateExampleFromSchema(schema);
        if (generated !== undefined) {
          return [{ name: 'success', value: generated }];
        }
      }

      return [];
    }

    function generateExampleFromSchema(schema, depth = 0) {
      if (!schema || depth > 4) return undefined;

      const resolved = resolveSchema(schema) || schema;
      if (!resolved || typeof resolved !== 'object') return undefined;

      if (resolved.example != null) return resolved.example;

      if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
        return resolved.enum[0];
      }

      if (resolved.oneOf && Array.isArray(resolved.oneOf) && resolved.oneOf.length > 0) {
        return generateExampleFromSchema(resolved.oneOf[0], depth + 1);
      }
      if (resolved.anyOf && Array.isArray(resolved.anyOf) && resolved.anyOf.length > 0) {
        return generateExampleFromSchema(resolved.anyOf[0], depth + 1);
      }
      if (resolved.allOf && Array.isArray(resolved.allOf) && resolved.allOf.length > 0) {
        const merged = {};
        resolved.allOf.forEach((part) => {
          const value = generateExampleFromSchema(part, depth + 1);
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(merged, value);
          }
        });
        if (Object.keys(merged).length > 0) return merged;
      }

      if (resolved.type === 'array' || resolved.items) {
        const itemExample = generateExampleFromSchema(resolved.items, depth + 1);
        return itemExample === undefined ? [] : [itemExample];
      }

      if (resolved.type === 'object' || resolved.properties) {
        const obj = {};
        const props = resolved.properties || {};
        Object.entries(props).forEach(([key, propSchema]) => {
          const value = generateExampleFromSchema(propSchema, depth + 1);
          obj[key] = value === undefined ? null : value;
        });
        return obj;
      }

      switch (resolved.type) {
        case 'string':
          if (resolved.format === 'date-time') return '2026-01-01T00:00:00.000Z';
          if (resolved.format === 'date') return '2026-01-01';
          if (resolved.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
          if (resolved.format === 'email') return 'user@example.com';
          if (resolved.format === 'uri') return 'https://example.com';
          return 'string';
        case 'integer':
        case 'number':
          return 0;
        case 'boolean':
          return true;
        default:
          return undefined;
      }
    }

    function extractErrorSummary(resp) {
      const jsonContent = getResponseJsonContent(resp);
      const examples = getExampleValuesFromContent(jsonContent);

      let errorCode = '—';
      let message = '—';
      const description = resp && resp.description ? String(resp.description) : '—';

      for (const ex of examples) {
        if (!ex || typeof ex !== 'object') continue;
        if ('errorCode' in ex && ex.errorCode != null && errorCode === '—') {
          errorCode = String(ex.errorCode);
        }
        if ('message' in ex && ex.message != null) {
          message = String(ex.message);
          break;
        }
      }

      return { errorCode, message, description };
    }

    function getSchemaDisplayType(schema) {
      if (!schema) return '—';
      const p = resolveSchema(schema) || schema;
      let type = p.type || '—';
      if (p.type === 'array' && p.items) {
        const item = resolveSchema(p.items) || p.items;
        const itemType = item.type || (item.properties ? 'object' : '—');
        type = 'array<' + itemType + '>';
      }
      if (p.format) type += ' (' + p.format + ')';
      if (p.enum) type = 'enum: ' + p.enum.join(', ');
      return type;
    }

    function renderSchemaTable(schema, options = { showRequired: true }) {
      let html = '<table><thead><tr><th>Campo</th><th>Tipo</th>';
      if (options.showRequired) {
        html += '<th>Obrigatório</th>';
      }
      html += '<th>Descrição</th></tr></thead><tbody>';
      html += renderSchemaRows(schema, '', 0, new Set(), options);
      html += '</tbody></table>';
      return html;
    }

    function renderSchemaRows(schema, prefix = '', depth = 0, visited = new Set(), options = { showRequired: true }) {
      const resolvedSchema = resolveSchema(schema) || schema;
      if (!resolvedSchema || !resolvedSchema.properties || depth > 4) return '';

      const visitKey = prefix + '|' + depth;
      if (visited.has(visitKey)) return '';
      visited.add(visitKey);

      let html = '';
      const required = Array.isArray(resolvedSchema.required) ? resolvedSchema.required : [];

      for (const [name, prop] of Object.entries(resolvedSchema.properties)) {
        const p = resolveSchema(prop) || prop;
        const fullName = prefix ? (prefix + '.' + name) : name;
        const indent = depth * 10;
        const fieldLabel = fullName;
        const type = getSchemaDisplayType(p);
        const desc = p.description || (p.example !== undefined ? 'Ex: ' + p.example : '—');

        html += '<tr>';
        html += '<td><code style="padding-left:' + indent + 'px; display:inline-block;">' + escapeHtml(fieldLabel) + '</code></td>';
        if (p.enum) {
          html += '<td><span class="enum-value-list">' + escapeHtml(type).replaceAll(', ', ',<wbr> ') + '</span></td>';
        } else {
          html += '<td>' + escapeHtml(type) + '</td>';
        }
        if (options.showRequired) {
          html += '<td>' + (required.includes(name) ? 'Sim' : 'Não') + '</td>';
        }
        html += '<td>' + escapeHtml(String(desc)) + '</td>';
        html += '</tr>';

        if (p.type === 'object' || p.properties) {
          html += renderSchemaRows(p, fullName, depth + 1, visited, options);
          continue;
        }

        if (p.type === 'array' && p.items) {
          const itemSchema = resolveSchema(p.items) || p.items;
          if (itemSchema && (itemSchema.type === 'object' || itemSchema.properties)) {
            html += renderSchemaRows(itemSchema, fullName + '[]', depth + 1, visited, options);
          }
        }
      }

      return html;
    }

    // ── View Switch ──────────────────────────────
    function switchView(view) {
      activeView = view;
      if (view !== 'manual') closeManualSidebar();
      if (view === 'api') setApiUrl();
      document.querySelectorAll('.navbar-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
      });
      document.getElementById('manual-view').classList.toggle('active', view === 'manual');
      const apiView = document.getElementById('api-view');
      apiView.classList.toggle('active', view === 'api');
      apiView.classList.toggle('loaded', scalarReady);
      if (view === 'api' && !scalarLoaded) {
        document.getElementById('scalar-iframe').src = scalarUrl;
        scalarLoaded = true;
      }
      if (view === 'manual') {
        ensureManualContentRendered();
        syncManualUrl();
      }
    }

    // ── Search ───────────────────────────────────
    function buildSearchIndex() {
      allSearchItems = [];
      // Manual tags
      manualTags.forEach((tag, i) => {
        allSearchItems.push({ type: 'manual', title: tag.name, preview: stripMd(tag.description).substring(0, 120), action: () => selectManualItem(i) });
      });
      // Endpoints
      for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
        endpoints.forEach((ep, i) => {
          allSearchItems.push({
            type: 'endpoint',
            title: ep.method + ' ' + (ep.summary || ep.path),
            preview: tag + ' — ' + (ep.description || ep.path).substring(0, 100),
            action: () => { if (activeView !== 'manual') switchView('manual'); selectEndpoint(tag, i); }
          });
        });
      }
    }

    function openSearch() {
      document.getElementById('search-overlay').classList.add('active');
      const input = document.getElementById('search-input');
      input.value = '';
      input.focus();
      onSearchInput('');
    }

    function closeSearch() {
      document.getElementById('search-overlay').classList.remove('active');
    }

    function onSearchInput(query) {
      const results = document.getElementById('search-results');
      const q = query.toLowerCase().trim();
      const items = q ? allSearchItems.filter(s => s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q)) : allSearchItems.slice(0, 20);

      if (items.length === 0) {
        results.innerHTML = '<div class="search-empty">Nenhum resultado para "' + escapeHtml(query) + '"</div>';
        return;
      }

      results.innerHTML = items.map((s, i) =>
        '<div class="search-result-item' + (i === 0 ? ' selected' : '') + '" data-idx="' + i + '">' +
          '<div class="search-result-title">' + escapeHtml(s.title) + '</div>' +
          '<div class="search-result-preview">' + escapeHtml(s.preview) + '</div>' +
        '</div>'
      ).join('');

      // Bind clicks
      results.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.onclick = () => { closeSearch(); items[i].action(); };
      });

      searchSelectedIndex = 0;
    }

    function stripMd(md) {
      return md.replace(/[#*\\`|>\-]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    // ── Keyboard ─────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); return; }
      if (e.key === 'Escape') { closeSearch(); return; }

      const overlay = document.getElementById('search-overlay');
      if (!overlay.classList.contains('active')) return;
      const items = overlay.querySelectorAll('.search-result-item');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchSelectedIndex = Math.min(searchSelectedIndex + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('selected', i === searchSelectedIndex));
        items[searchSelectedIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchSelectedIndex = Math.max(searchSelectedIndex - 1, 0);
        items.forEach((el, i) => el.classList.toggle('selected', i === searchSelectedIndex));
        items[searchSelectedIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[searchSelectedIndex];
        if (selected) selected.click();
      }
    });

    window.addEventListener('resize', () => {
      syncNavbarOffset();
      if (!isMobileLayout()) closeManualSidebar();
      if (activeView === 'manual') updateManualTocActive();
    });

    window.addEventListener('hashchange', () => {
      applyRouteFromHash();
    });

    window.addEventListener('popstate', () => {
      applyRouteFromPath() || applyRouteFromHash();
    });

    // ── Boot ─────────────────────────────────────
    init();
