(function initDocsPortalSidebarModule(globalScope) {
  interface ManualTag {
    name: string;
    description: string;
    apiTag?: string;
  }
  interface EndpointDoc {
    method: string;
    path: string;
    summary?: string;
    description?: string;
  }
  interface EndpointSelection {
    tag: string;
    index: number;
  }
  type EndpointsByTag = Record<string, EndpointDoc[]>;
  type CurrentManualSelection =
    | { type: 'manual'; slug: string; index?: number; tag?: string }
    | { type: 'endpoint'; tag: string; index: number }
    | null;

  interface AuthResolver {
    getPrimaryAuthKey: (endpoint: EndpointDoc | undefined) => string;
    getAuthGroupMeta: (authKey: string) => { label: string; order: number };
  }

  interface SidebarDeps {
    getManualTags: () => ManualTag[];
    getEndpointsByTag: () => EndpointsByTag;
    escapeHtml: (value: string) => string;
    marked: { parse: (value: string) => string };
    slugifyManualName: (name: string) => string;
    setManualUrl: (slug: string) => void;
    setEndpointUrl: (tag: string, index: number) => void;
    closeManualSidebar: () => void;
    renderManualHtml: (html: string) => void;
    buildEndpointDoc: (endpoint: EndpointDoc, tag: string) => string;
    setCurrentEndpointSelection: (value: EndpointSelection | null) => void;
    setCurrentManualSelection: (value: CurrentManualSelection) => void;
    getCurrentManualSelection: () => CurrentManualSelection;
  }

  function createSidebarModule(deps: SidebarDeps) {
    const {
      getManualTags,
      getEndpointsByTag,
      escapeHtml,
      marked,
      slugifyManualName,
      setManualUrl,
      setEndpointUrl,
      closeManualSidebar,
      renderManualHtml,
      buildEndpointDoc,
      setCurrentEndpointSelection,
      setCurrentManualSelection,
      getCurrentManualSelection,
    } = deps;

    function getStandaloneManuals(): ManualTag[] {
      return getManualTags().filter((tag) => !tag.apiTag);
    }

    function getLinkedManual(apiTag: string): ManualTag | null {
      return getManualTags().find((tag) => tag.apiTag === apiTag) || null;
    }

    function clearActive() {
      document
        .querySelectorAll('.sidebar-item.active, .sidebar-endpoint.active')
        .forEach((element) => element.classList.remove('active'));
    }

    function selectManualItem(index: number) {
      setCurrentEndpointSelection(null);
      closeManualSidebar();
      clearActive();

      const items = document.querySelectorAll('.sidebar-item[data-type="manual"]');
      if (items[index]) items[index].classList.add('active');

      const tag = getManualTags()[index];
      if (!tag) return;

      const slug = slugifyManualName(tag.name);
      setCurrentManualSelection({ type: 'manual', slug, index });
      setManualUrl(slug);
      renderManualHtml(marked.parse(tag.description));
    }

    function selectEndpoint(tag: string, index: number) {
      setCurrentEndpointSelection({ tag, index });
      setCurrentManualSelection({ type: 'endpoint', tag, index });
      closeManualSidebar();
      clearActive();

      const linked = getLinkedManual(tag);
      const offset = linked ? 1 : 0;
      const groups = document.querySelectorAll('.sidebar-group');
      groups.forEach((group) => {
        const headerText = group.querySelector('.sidebar-group-header span')?.textContent;
        if (headerText === tag) {
          group.classList.add('open');
          const endpoints = group.querySelectorAll('.sidebar-endpoint');
          if (endpoints[index + offset]) endpoints[index + offset].classList.add('active');
        }
      });

      const endpoint = getEndpointsByTag()[tag]?.[index];
      if (!endpoint) return;
      setEndpointUrl(tag, index);
      renderManualHtml(buildEndpointDoc(endpoint, tag));
    }

    function selectGroupOverview(tag: string) {
      setCurrentEndpointSelection(null);
      closeManualSidebar();
      clearActive();

      const groups = document.querySelectorAll('.sidebar-group');
      groups.forEach((group) => {
        const headerText = group.querySelector('.sidebar-group-header span')?.textContent;
        if (headerText === tag) {
          group.classList.add('open');
          const endpoints = group.querySelectorAll('.sidebar-endpoint');
          if (endpoints[0]) endpoints[0].classList.add('active');
        }
      });

      const linked = getLinkedManual(tag);
      if (linked?.name) {
        setCurrentManualSelection({
          type: 'manual',
          slug: slugifyManualName(linked.name),
          tag,
        });
      } else {
        setCurrentManualSelection(null);
      }

      let html = '';
      if (linked) {
        html += marked.parse(linked.description);
        html += '<hr>';
      }

      const endpoints = getEndpointsByTag()[tag] || [];
      html += '<h2>Endpoints</h2>';
      html +=
        '<table><thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead><tbody>';
      endpoints.forEach((endpoint, index) => {
        html +=
          '<tr class="endpoint-row" data-tag="' +
          escapeHtml(tag) +
          '" data-idx="' +
          index +
          '" style="cursor:pointer">';
        html +=
          '<td><span class="method-badge method-' +
          endpoint.method +
          '">' +
          endpoint.method +
          '</span></td>';
        html += '<td><code>' + escapeHtml(endpoint.path) + '</code></td>';
        html += '<td>' + escapeHtml(endpoint.summary || endpoint.description || '—') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';

      renderManualHtml(html);

      const content = document.getElementById('manual-content');
      if (!content) return;
      content.querySelectorAll('.endpoint-row').forEach((row) => {
        (row as HTMLElement).addEventListener('click', () => {
          const rowTag = (row as HTMLElement).dataset.tag;
          const rowIndex = Number.parseInt((row as HTMLElement).dataset.idx || '-1', 10);
          if (!rowTag || Number.isNaN(rowIndex) || rowIndex < 0) return;
          selectEndpoint(rowTag, rowIndex);
        });
      });
    }

    function groupTagsByAuth(authResolver: AuthResolver) {
      const authGroups: Record<string, Array<{ tag: string; endpoints: EndpointDoc[] }>> = {};

      Object.entries(getEndpointsByTag()).forEach(([tag, endpoints]) => {
        const authKey = authResolver.getPrimaryAuthKey(endpoints[0]);
        if (!authGroups[authKey]) authGroups[authKey] = [];
        authGroups[authKey].push({ tag, endpoints });
      });

      return Object.entries(authGroups)
        .sort((a, b) => {
          const am = authResolver.getAuthGroupMeta(a[0]);
          const bm = authResolver.getAuthGroupMeta(b[0]);
          if (am.order !== bm.order) return am.order - bm.order;
          return am.label.localeCompare(bm.label);
        })
        .map(([authKey, groups]) => ({
          authKey,
          ...authResolver.getAuthGroupMeta(authKey),
          groups: groups.sort((a, b) => a.tag.localeCompare(b.tag)),
        }));
    }

    function renderSidebar() {
      const sidebar = document.getElementById('manual-sidebar');
      if (!sidebar) return;
      sidebar.innerHTML = '';

      const standalones = getStandaloneManuals();
      if (standalones.length <= 0) return;

      const title = document.createElement('div');
      title.className = 'sidebar-section-title';
      title.textContent = 'Documentação';
      sidebar.appendChild(title);

      standalones.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'sidebar-item' + (index === 0 ? ' active' : '');
        item.textContent = tag.name;
        item.dataset.type = 'manual';
        item.dataset.index = String(getManualTags().indexOf(tag));
        item.onclick = () => selectManualItem(getManualTags().indexOf(tag));
        sidebar.appendChild(item);
      });
    }

    function renderApiGroups(authResolver: AuthResolver) {
      const sidebar = document.getElementById('manual-sidebar');
      if (!sidebar) return;

      const title = document.createElement('div');
      title.className = 'sidebar-section-title';
      title.style.marginTop = '12px';
      title.textContent = 'Endpoints';
      sidebar.appendChild(title);

      groupTagsByAuth(authResolver).forEach((authBlock) => {
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
          header.innerHTML = '<span>' + escapeHtml(tag) + '</span><span class="arrow">▶</span>';
          header.onclick = () => group.classList.toggle('open');

          const items = document.createElement('div');
          items.className = 'sidebar-group-items';

          if (linked) {
            const overview = document.createElement('div');
            overview.className = 'sidebar-endpoint';
            overview.innerHTML = '<span style="font-size:12px">📖</span> Visão Geral';
            overview.onclick = (event) => {
              event.stopPropagation();
              selectGroupOverview(tag);
            };
            items.appendChild(overview);
          }

          endpoints.forEach((endpoint, index) => {
            const item = document.createElement('div');
            item.className = 'sidebar-endpoint';
            item.innerHTML =
              '<span class="method-badge method-' +
              endpoint.method +
              '">' +
              endpoint.method +
              '</span> ' +
              escapeHtml(endpoint.summary || endpoint.path);
            item.onclick = (event) => {
              event.stopPropagation();
              selectEndpoint(tag, index);
            };
            items.appendChild(item);
          });

          group.appendChild(header);
          group.appendChild(items);
          authContainer.appendChild(group);
        });

        sidebar.appendChild(authContainer);
      });
    }

    function ensureManualSelection() {
      const selection = getCurrentManualSelection();
      if (selection && selection.type === 'manual' && Number.isInteger(selection.index)) {
        const index = selection.index;
        if (typeof index === 'number') {
          selectManualItem(index);
        }
      }
    }

    return {
      clearActive,
      getLinkedManual,
      getStandaloneManuals,
      renderApiGroups,
      renderSidebar,
      selectEndpoint,
      selectGroupOverview,
      selectManualItem,
      ensureManualSelection,
    };
  }

  globalScope.DocsPortalSidebar = {
    createSidebarModule,
  };
})(window);
