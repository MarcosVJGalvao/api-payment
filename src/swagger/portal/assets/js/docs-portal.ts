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
const portalUtils = window.PortalUtils || {};
const slugifyHeading = typeof portalUtils.slugifyHeading === 'function'
    ? portalUtils.slugifyHeading
    : (text) => String(text || '');
const stripMd = typeof portalUtils.stripMd === 'function'
    ? portalUtils.stripMd
    : (text) => String(text || '');
const escapeHtml = typeof portalUtils.escapeHtml === 'function'
    ? portalUtils.escapeHtml
    : (text) => String(text || '');
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
let scalarRouteSyncTimer = null;
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
    setScalarRouteSyncTimer: (timerId) => {
        scalarRouteSyncTimer = timerId;
    },
    getScalarRouteSyncTimer: () => scalarRouteSyncTimer,
    onSyncApiPortalUrlFromScalarSelection: () => syncApiPortalUrlFromScalarSelection(),
});
const tocModule = window.DocsPortalToc.createTocModule({
    getActiveView: () => activeView,
    getManualTocItems: () => manualTocItems,
    setManualTocItems: (items) => {
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
    setSearchSelectedIndex: (value) => {
        searchSelectedIndex = value;
    },
    getAllSearchItems: () => allSearchItems,
    setAllSearchItems: (items) => {
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
    getAuthLabelForEndpoint: (endpoint) => authModule.getAuthLabelForEndpoint(endpoint),
    renderRequiredHeadersBox,
});
const scalarSyncModule = window.DocsPortalScalarSync.createScalarSyncModule({
    getScalarUrl: () => scalarUrl,
    getEndpointsByTag: () => endpointsByTag,
    slugifyEndpointTag,
    getCurrentEndpointSelection: () => currentEndpointSelection,
    getActiveView: () => activeView,
    getScalarLoaded: () => scalarLoaded,
    setScalarLoaded: (loaded) => {
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
    setCurrentEndpointSelection: (value) => {
        currentEndpointSelection = value;
    },
    setCurrentManualSelection: (value) => {
        currentManualSelection = value;
    },
    getCurrentManualSelection: () => currentManualSelection,
});
const openApiModule = window.DocsPortalOpenApi.createOpenApiModule({
    getApiSpecUrl: () => apiSpecUrl,
    onSpecLoaded: (spec, groupedEndpoints) => {
        openApiSpec = spec;
        endpointsByTag = groupedEndpoints;
    },
    onSpecLoadError: (error) => {
        console.error('Failed to load OpenAPI spec:', error);
    },
});
function isMobileLayout() {
    return window.matchMedia('(max-width: 820px)').matches;
}
function syncNavbarOffset() {
    const navbar = document.querySelector('.navbar');
    if (!navbar)
        return;
    const height = Math.ceil(navbar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--navbar-offset', height + 'px');
}
function toggleManualSidebar() {
    if (!isMobileLayout())
        return;
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
function slugifyManualName(name) {
    return routingModule.slugifyManualName(name);
}
function slugifyEndpointTag(tag) {
    return routingModule.slugifyEndpointTag(tag);
}
function setManualUrl(slug) {
    routingModule.setManualUrl(slug);
}
function setEndpointUrl(tag, index) {
    routingModule.setEndpointUrl(tag, index);
}
function applyScalarEndpointSelectionToIframe() {
    scalarSyncModule.applyScalarEndpointSelectionToIframe();
}
function syncApiPortalUrlFromScalarSelection() {
    scalarSyncModule.syncApiPortalUrlFromScalarSelection();
}
function updateManualTocActive() {
    tocModule.updateManualTocActive();
}
function renderManualHtml(html) {
    tocModule.renderManualHtml(html);
}
// ── Init ─────────────────────────────────────
async function init() {
    syncNavbarOffset();
    const scalarIframe = document.getElementById('scalar-iframe');
    scalarIframe.addEventListener('load', () => {
        scalarReady = true;
        document.getElementById('api-view').classList.add('loaded');
        syncApiPortalUrlFromScalarSelection();
    });
    renderSidebar();
    if (!routingModule.applyRouteFromPath() &&
        !routingModule.applyRouteFromHash() &&
        manualTags.length > 0) {
        selectManualItem(0);
    }
    await loadOpenApiSpec();
    routingModule.applyRouteFromPath() || routingModule.applyRouteFromHash();
}
// ── Load OpenAPI spec ────────────────────────
async function loadOpenApiSpec() {
    await openApiModule.loadOpenApiSpec();
    renderApiGroups();
    buildSearchIndex();
}
function renderRequiredHeadersBox(ep) {
    const headers = authModule.getRequiredHeadersForEndpoint(ep);
    let html = '<h2>Headers Necess\u00e1rios</h2>';
    if (!headers.length) {
        html += '<p>N\u00e3o \u00e9 necess\u00e1rio enviar headers adicionais nesta requisi\u00e7\u00e3o.</p>';
        return html;
    }
    html += '<table><thead><tr><th>Nome</th><th>Descrição</th></tr></thead><tbody>';
    headers.forEach((h) => {
        html += '<tr>';
        html += '<td><code>' + escapeHtml(h.name) + '</code></td>';
        const headerDescription = h.required
            ? '<strong>Obrigatório.</strong> ' +
                escapeHtml(h.description || 'Header da requisição')
            : escapeHtml(h.description || 'Header da requisição');
        html += '<td>' + headerDescription + '</td>';
        html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
}
// ── Sidebar ──────────────────────────────────
function renderSidebar() {
    sidebarModule.renderSidebar();
}
function renderApiGroups() {
    sidebarModule.renderApiGroups({
        getPrimaryAuthKey: (endpoint) => authModule.getPrimaryAuthKey(endpoint),
        getAuthGroupMeta: (authKey) => authModule.getAuthGroupMeta(authKey),
    });
}
// ── Selection ────────────────────────────────
function selectManualItem(index) {
    sidebarModule.selectManualItem(index);
}
function selectEndpoint(tag, index) {
    sidebarModule.selectEndpoint(tag, index);
}
function selectGroupOverview(tag) {
    sidebarModule.selectGroupOverview(tag);
}
// ── Endpoint doc builder ─────────────────────
function buildEndpointDoc(ep, tag) {
    return endpointDocModule.buildEndpointDoc(ep, tag);
}
// ── View Switch ──────────────────────────────
function switchView(view) {
    activeView = view;
    if (view !== 'manual')
        closeManualSidebar();
    if (view === 'api')
        routingModule.setApiUrl();
    document.querySelectorAll('.navbar-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });
    document.getElementById('manual-view').classList.toggle('active', view === 'manual');
    const apiView = document.getElementById('api-view');
    apiView.classList.toggle('active', view === 'api');
    apiView.classList.toggle('loaded', scalarReady);
    if (view === 'api' && !scalarLoaded) {
        applyScalarEndpointSelectionToIframe();
    }
    if (view === 'api') {
        if (!scalarLoaded) {
            document.getElementById('scalar-iframe').src = scalarUrl;
            scalarLoaded = true;
        }
        else {
            applyScalarEndpointSelectionToIframe();
        }
        routingModule.ensureScalarRouteSyncRunning();
    }
    if (view === 'manual') {
        routingModule.ensureManualContentRendered();
        routingModule.syncManualUrl();
    }
}
// ── Search ───────────────────────────────────
function buildSearchIndex() {
    searchModule.buildSearchIndex();
}
function openSearch() {
    searchModule.openSearch();
}
function closeSearch() {
    searchModule.closeSearch();
}
function onSearchInput(query) {
    searchModule.onSearchInput(query);
}
// ── Keyboard ─────────────────────────────────
searchModule.bindKeyboardShortcuts();
window.addEventListener('resize', () => {
    syncNavbarOffset();
    if (!isMobileLayout())
        closeManualSidebar();
    if (activeView === 'manual')
        updateManualTocActive();
});
window.addEventListener('hashchange', () => {
    routingModule.applyRouteFromHash();
});
window.addEventListener('popstate', () => {
    routingModule.applyRouteFromPath() || routingModule.applyRouteFromHash();
});
// ── Boot ─────────────────────────────────────
init();
