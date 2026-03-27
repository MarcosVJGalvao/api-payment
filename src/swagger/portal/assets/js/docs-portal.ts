type PortalView = 'manual' | 'api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ManualTag {
  name: string;
  description: string;
  apiTag?: string;
}

interface EndpointDoc {
  method: HttpMethod | string;
  path: string;
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: { enum?: unknown[]; type?: string };
  }>;
  requestBody?: {
    content?: Record<string, { schema?: unknown; examples?: Record<string, { value?: unknown }> }>;
  };
  responses?: Record<string, { description?: string; content?: Record<string, unknown> }>;
  security?: Array<Record<string, unknown>>;
}

type EndpointsByTag = Record<string, EndpointDoc[]>;

interface EndpointSelection {
  tag: string;
  index: number;
}

type CurrentManualSelection =
  | {
      type: 'manual';
      slug: string;
      index?: number;
      tag?: string;
    }
  | {
      type: 'endpoint';
      tag: string;
      index: number;
    }
  | null;

interface PortalData {
  manualTags?: ManualTag[];
  scalarUrl?: string;
  apiSpecUrl?: string;
}

interface PortalUtils {
  slugifyHeading?: (text: string) => string;
  stripMd?: (text: string) => string;
  escapeHtml?: (text: string) => string;
}

declare const marked: {
  parse: (markdown: string) => string;
};

const portalDataScript = document.getElementById('docs-portal-data');
const portalData: PortalData = portalDataScript
  ? (JSON.parse(portalDataScript.textContent || '{}') as PortalData)
  : {};

const manualTags: ManualTag[] = Array.isArray(portalData.manualTags) ? portalData.manualTags : [];
const scalarUrl = typeof portalData.scalarUrl === 'string' ? portalData.scalarUrl : '/docs/api';
const apiSpecUrl = typeof portalData.apiSpecUrl === 'string' ? portalData.apiSpecUrl : '/api/openapi.json';

const portalUtils = (window.PortalUtils || {}) as PortalUtils;
const slugifyHeading =
  typeof portalUtils.slugifyHeading === 'function'
    ? portalUtils.slugifyHeading
    : (text: string) => String(text || '');
const stripMd =
  typeof portalUtils.stripMd === 'function' ? portalUtils.stripMd : (text: string) => String(text || '');
const escapeHtml =
  typeof portalUtils.escapeHtml === 'function'
    ? portalUtils.escapeHtml
    : (text: string) => String(text || '');

let activeView: PortalView = 'manual';
let scalarLoaded = false;
let scalarReady = false;
let searchSelectedIndex = 0;
let openApiSpec: unknown = null;
let endpointsByTag: EndpointsByTag = {};
let allSearchItems: unknown[] = [];
let manualTocItems: unknown[] = [];
let currentEndpointSelection: EndpointSelection | null = null;
let currentManualSelection: CurrentManualSelection = null;
let scalarRouteSyncTimer: number | null = null;
let scalarLoadFallbackTimer: number | null = null;

const routingModule = window.DocsPortalRouting.createRoutingModule({
  getManualTags: () => manualTags,
  getEndpointsByTag: () => endpointsByTag,
  getActiveView: () => activeView,
  switchView,
  selectManualItem,
  selectEndpoint,
  slugifyHeading,
  getCurrentManualSelection: () => currentManualSelection,
  getCurrentEndpointSelection: () => currentEndpointSelection,
  setScalarRouteSyncTimer: (timerId: number) => {
    scalarRouteSyncTimer = timerId;
  },
  getScalarRouteSyncTimer: () => scalarRouteSyncTimer,
  onSyncApiPortalUrlFromScalarSelection: () => syncApiPortalUrlFromScalarSelection(),
});

const tocModule = window.DocsPortalToc.createTocModule({
  getActiveView: () => activeView,
  getManualTocItems: () => manualTocItems,
  setManualTocItems: (items: unknown[]) => {
    manualTocItems = items;
  },
  escapeHtml,
  slugifyHeading,
});

const searchModule = window.DocsPortalSearch.createSearchModule({
  getManualTags: () => manualTags,
  getEndpointsByTag: () => endpointsByTag,
  getActiveView: () => activeView,
  switchView,
  selectManualItem,
  selectEndpoint,
  escapeHtml,
  stripMd,
  getSearchSelectedIndex: () => searchSelectedIndex,
  setSearchSelectedIndex: (value: number) => {
    searchSelectedIndex = value;
  },
  getAllSearchItems: () => allSearchItems,
  setAllSearchItems: (items: unknown[]) => {
    allSearchItems = items;
  },
});

const authModule = window.DocsPortalAuth.createAuthModule({
  getOpenApiSpec: () => openApiSpec,
});

const endpointDocModule = window.DocsPortalEndpointDoc.createEndpointDocModule({
  escapeHtml,
  marked,
  getOpenApiSpec: () => openApiSpec,
  getAuthLabelForEndpoint: (endpoint: EndpointDoc) => authModule.getAuthLabelForEndpoint(endpoint),
  renderRequiredHeadersBox,
});

const scalarSyncModule = window.DocsPortalScalarSync.createScalarSyncModule({
  getScalarUrl: () => scalarUrl,
  getEndpointsByTag: () => endpointsByTag,
  slugifyEndpointTag,
  getCurrentEndpointSelection: () => currentEndpointSelection,
  getActiveView: () => activeView,
  getScalarLoaded: () => scalarLoaded,
  setScalarLoaded: (loaded: boolean) => {
    scalarLoaded = loaded;
  },
});

const sidebarModule = window.DocsPortalSidebar.createSidebarModule({
  getManualTags: () => manualTags,
  getEndpointsByTag: () => endpointsByTag,
  escapeHtml,
  marked,
  slugifyManualName,
  setManualUrl,
  setEndpointUrl,
  closeManualSidebar,
  renderManualHtml,
  buildEndpointDoc,
  setCurrentEndpointSelection: (value: EndpointSelection | null) => {
    currentEndpointSelection = value;
  },
  setCurrentManualSelection: (value: CurrentManualSelection) => {
    currentManualSelection = value;
  },
  getCurrentManualSelection: () => currentManualSelection,
});

const openApiModule = window.DocsPortalOpenApi.createOpenApiModule({
  getApiSpecUrl: () => apiSpecUrl,
  onSpecLoaded: (spec: unknown, groupedEndpoints: EndpointsByTag) => {
    openApiSpec = spec;
    endpointsByTag = groupedEndpoints;
  },
  onSpecLoadError: (error: unknown) => {
    console.error('Failed to load OpenAPI spec:', error);
  },
});

function isMobileLayout(): boolean {
  return window.matchMedia('(max-width: 820px)').matches;
}

function syncNavbarOffset(): void {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const height = Math.ceil(navbar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--navbar-offset', height + 'px');
}

function toggleManualSidebar(): void {
  if (!isMobileLayout()) return;
  const manualView = document.getElementById('manual-view');
  const backdrop = document.getElementById('manual-sidebar-backdrop');
  if (!manualView || !backdrop) return;
  const isOpen = manualView.classList.toggle('sidebar-open');
  backdrop.classList.toggle('active', isOpen);
}

function closeManualSidebar(): void {
  const manualView = document.getElementById('manual-view');
  const backdrop = document.getElementById('manual-sidebar-backdrop');
  if (!manualView || !backdrop) return;
  manualView.classList.remove('sidebar-open');
  backdrop.classList.remove('active');
}

function slugifyManualName(name: string): string {
  return routingModule.slugifyManualName(name);
}

function slugifyEndpointTag(tag: string): string {
  return routingModule.slugifyEndpointTag(tag);
}

function setManualUrl(slug: string): void {
  routingModule.setManualUrl(slug);
}

function setEndpointUrl(tag: string, index: number): void {
  routingModule.setEndpointUrl(tag, index);
}

function applyScalarEndpointSelectionToIframe(): void {
  scalarSyncModule.applyScalarEndpointSelectionToIframe();
}

function syncApiPortalUrlFromScalarSelection(): void {
  scalarSyncModule.syncApiPortalUrlFromScalarSelection();
}

function updateManualTocActive(): void {
  tocModule.updateManualTocActive();
}

function renderManualHtml(html: string): void {
  tocModule.renderManualHtml(html);
}

async function init(): Promise<void> {
  syncNavbarOffset();

  const markScalarReady = (): void => {
    scalarReady = true;
    const apiView = document.getElementById('api-view');
    apiView?.classList.add('loaded');
    if (scalarLoadFallbackTimer != null) {
      window.clearTimeout(scalarLoadFallbackTimer);
      scalarLoadFallbackTimer = null;
    }
  };

  const scalarIframe = document.getElementById('scalar-iframe') as HTMLIFrameElement | null;
  if (scalarIframe) {
    scalarIframe.addEventListener('load', () => {
      markScalarReady();
      syncApiPortalUrlFromScalarSelection();
    });
    scalarIframe.addEventListener('error', () => {
      markScalarReady();
    });
  }

  renderSidebar();
  if (!routingModule.applyRouteFromPath() && !routingModule.applyRouteFromHash() && manualTags.length > 0) {
    selectManualItem(0);
  }

  await loadOpenApiSpec();
  routingModule.applyRouteFromPath() || routingModule.applyRouteFromHash();
}

async function loadOpenApiSpec(): Promise<void> {
  await openApiModule.loadOpenApiSpec();
  renderApiGroups();
  buildSearchIndex();
}

function renderRequiredHeadersBox(ep: EndpointDoc): string {
  const headers = authModule.getRequiredHeadersForEndpoint(ep) as Array<{
    name: string;
    required: boolean;
    description?: string;
  }>;
  let html = '<h2>Headers Necessários</h2>';
  if (!headers.length) {
    html += '<p>Não é necessário enviar headers adicionais nesta requisição.</p>';
    return html;
  }
  html += '<table><thead><tr><th>Nome</th><th>Descrição</th></tr></thead><tbody>';
  headers.forEach((h) => {
    html += '<tr>';
    html += '<td><code>' + escapeHtml(h.name) + '</code></td>';
    const headerDescription = h.required
      ? '<strong>Obrigatório.</strong> ' + escapeHtml(h.description || 'Header da requisição')
      : escapeHtml(h.description || 'Header da requisição');
    html += '<td>' + headerDescription + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function renderSidebar(): void {
  sidebarModule.renderSidebar();
}

function renderApiGroups(): void {
  sidebarModule.renderApiGroups({
    getPrimaryAuthKey: (endpoint: EndpointDoc) => authModule.getPrimaryAuthKey(endpoint),
    getAuthGroupMeta: (authKey: string) => authModule.getAuthGroupMeta(authKey),
  });
}

function selectManualItem(index: number): void {
  sidebarModule.selectManualItem(index);
}

function selectEndpoint(tag: string, index: number): void {
  sidebarModule.selectEndpoint(tag, index);
}

function selectGroupOverview(tag: string): void {
  sidebarModule.selectGroupOverview(tag);
}

function buildEndpointDoc(ep: EndpointDoc, tag: string): string {
  return endpointDocModule.buildEndpointDoc(ep, tag);
}

function switchView(view: PortalView): void {
  activeView = view;
  if (view !== 'manual') closeManualSidebar();
  if (view === 'api') routingModule.setApiUrl();

  document.querySelectorAll('.navbar-tab').forEach((tab) => {
    const element = tab as HTMLElement;
    element.classList.toggle('active', element.dataset.view === view);
  });

  const manualView = document.getElementById('manual-view');
  manualView?.classList.toggle('active', view === 'manual');

  const apiView = document.getElementById('api-view');
  if (!apiView) return;
  apiView.classList.toggle('active', view === 'api');
  apiView.classList.toggle('loaded', scalarReady);

  if (view === 'api' && !scalarLoaded) {
    applyScalarEndpointSelectionToIframe();
  }
  if (view === 'api') {
    if (!scalarReady && scalarLoadFallbackTimer == null) {
      scalarLoadFallbackTimer = window.setTimeout(() => {
        const apiViewFallback = document.getElementById('api-view');
        apiViewFallback?.classList.add('loaded');
        scalarLoadFallbackTimer = null;
      }, 12000);
    }
    if (!scalarLoaded) {
      const iframe = document.getElementById('scalar-iframe') as HTMLIFrameElement | null;
      if (iframe) iframe.src = scalarUrl;
      scalarLoaded = true;
    } else {
      applyScalarEndpointSelectionToIframe();
    }
    routingModule.ensureScalarRouteSyncRunning();
  }
  if (view === 'manual') {
    routingModule.ensureManualContentRendered();
    routingModule.syncManualUrl();
  }
}

function buildSearchIndex(): void {
  searchModule.buildSearchIndex();
}

function openSearch(): void {
  searchModule.openSearch();
}

function closeSearch(): void {
  searchModule.closeSearch();
}

function onSearchInput(query: string): void {
  searchModule.onSearchInput(query);
}

searchModule.bindKeyboardShortcuts();

window.addEventListener('resize', () => {
  syncNavbarOffset();
  if (!isMobileLayout()) closeManualSidebar();
  if (activeView === 'manual') updateManualTocActive();
});

window.addEventListener('hashchange', () => {
  routingModule.applyRouteFromHash();
});

window.addEventListener('popstate', () => {
  routingModule.applyRouteFromPath() || routingModule.applyRouteFromHash();
});

init();
