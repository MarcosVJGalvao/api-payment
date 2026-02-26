import { IManualTag } from '../interfaces/manual-tag.interface';

interface IDocsPortalConfig {
  title: string;
  apiSpecUrl: string;
  scalarUrl: string;
}

/**
 * Gera o HTML do portal de documentação com navbar Manual/API
 * @param config - Configurações do portal
 * @param manualTags - Tags de documentação narrativa para renderizar no sidebar
 */
export function buildDocsPortalHtml(
  config: IDocsPortalConfig,
  manualTags: IManualTag[],
): string {
  const manualTagsJson = JSON.stringify(manualTags);
  const sc = '<' + '/script>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <link rel="icon" href="data:,">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="/docs/assets/marked.js">${sc}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Scalar deepSpace theme tokens ──────────────────── */
    :root {
      --scalar-background-1: #09090b;
      --scalar-background-2: #18181b;
      --scalar-background-3: #2c2c30;
      --scalar-background-4: #3f3f46;
      --scalar-color-1: #fafafa;
      --scalar-color-2: #a1a1aa;
      --scalar-color-3: rgba(255, 255, 255, 0.533);
      --scalar-border: rgba(255, 255, 255, 0.16);
      --scalar-radius: 6px;
      --scalar-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --scalar-font-code: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace;
      --navbar-height: 48px;
      --navbar-offset: 49px; /* fallback; overwritten in runtime */
      --sidebar-width: clamp(220px, 24vw, 280px);
      --transition: 150ms ease;
    }

    body {
      font-family: var(--scalar-font);
      background: var(--scalar-background-1);
      color: var(--scalar-color-1);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── Navbar ─────────────────────────────────── */
    .navbar {
      position: sticky;
      top: 0; left: 0; right: 0;
      height: var(--navbar-height);
      background: var(--scalar-background-2);
      border-bottom: 1px solid var(--scalar-border);
      display: flex;
      align-items: center;
      padding: 0 20px;
      z-index: 100;
      gap: 6px;
      flex-wrap: nowrap;
      overflow: hidden;
      flex: 0 0 auto;
    }
    .navbar-brand {
      font-weight: 700; font-size: 14px; color: var(--scalar-color-1);
      margin-right: 12px; white-space: nowrap; letter-spacing: -0.3px;
      flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis;
    }
    .navbar-tabs { display: flex; gap: 2px; flex: 0 0 auto; }
    .navbar-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: var(--scalar-radius);
      font-size: 13px; font-weight: 500; color: var(--scalar-color-2);
      cursor: pointer; transition: all var(--transition);
      border: 1px solid transparent; background: transparent; user-select: none;
    }
    .navbar-tab:hover { color: var(--scalar-color-1); background: var(--scalar-background-3); }
    .navbar-tab.active { color: #fff; background: var(--scalar-background-3); border-color: var(--scalar-border); }
    .navbar-spacer { flex: 1 1 auto; min-width: 0; }
    .navbar-search {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 12px; border-radius: var(--scalar-radius);
      background: var(--scalar-background-3); border: 1px solid var(--scalar-border);
      color: var(--scalar-color-3); font-size: 12px; cursor: pointer;
      transition: border-color var(--transition);
      flex: 0 0 auto;
      white-space: nowrap;
    }
    .navbar-search:hover { border-color: var(--scalar-color-2); }
    .navbar-search kbd {
      padding: 1px 5px; border-radius: 3px;
      background: var(--scalar-background-4); border: 1px solid var(--scalar-border);
      font-size: 10px; font-family: inherit;
    }

    /* ── Content Area ──────────────────────────── */
    .content-area {
      margin-top: 0;
      height: auto;
      flex: 1 1 auto;
      min-height: 0;
      min-width: 0;
    }

    /* ── Manual View ───────────────────────────── */
    .manual-view { display: none; height: 100%; min-width: 0; }
    .manual-view.active { display: flex; min-width: 0; }

    .manual-sidebar {
      width: var(--sidebar-width); min-width: var(--sidebar-width);
      height: 100%; background: var(--scalar-background-1);
      border-right: 1px solid var(--scalar-border);
      overflow-y: auto; padding: 12px 0;
    }
    .manual-sidebar::-webkit-scrollbar { width: 4px; }
    .manual-sidebar::-webkit-scrollbar-track { background: transparent; }
    .manual-sidebar::-webkit-scrollbar-thumb { background: var(--scalar-border); border-radius: 2px; }

    /* ── Sidebar Items ─────────────────────────── */
    .sidebar-section-title {
      padding: 16px 16px 6px; font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1.2px; color: var(--scalar-color-3);
    }
    .sidebar-section-title:first-child { padding-top: 6px; }

    .sidebar-item {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 16px; font-size: 13px; color: var(--scalar-color-2);
      cursor: pointer; transition: all var(--transition);
      border-left: 2px solid transparent;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sidebar-item:hover { color: var(--scalar-color-1); background: var(--scalar-background-2); }
    .sidebar-item.active { color: var(--scalar-color-1); background: var(--scalar-background-2); border-left-color: var(--scalar-color-1); font-weight: 500; }

    /* ── Sidebar Groups (Controllers) ──────────── */
    .sidebar-group { margin-top: 4px; }
    .sidebar-group-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 16px; font-size: 13px; font-weight: 500;
      color: var(--scalar-color-1); cursor: pointer;
      transition: background var(--transition); user-select: none;
      gap: 8px;
    }
    .sidebar-group-header span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sidebar-group-header:hover { background: var(--scalar-background-2); }
    .sidebar-group-header .arrow { font-size: 10px; color: var(--scalar-color-2); transition: transform var(--transition); }
    .sidebar-group.open .arrow { transform: rotate(90deg); }
    .sidebar-group-items { display: none; }
    .sidebar-group.open .sidebar-group-items { display: block; }

    .sidebar-endpoint {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 16px 5px 28px; font-size: 12px; color: var(--scalar-color-2);
      cursor: pointer; transition: all var(--transition);
      border-left: 2px solid transparent;
      min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sidebar-endpoint:hover { color: var(--scalar-color-1); background: var(--scalar-background-2); }
    .sidebar-endpoint.active { color: var(--scalar-color-1); background: var(--scalar-background-2); border-left-color: var(--scalar-color-1); }

    .method-badge {
      font-size: 10px; font-weight: 700; padding: 1px 5px;
      border-radius: 3px; text-transform: uppercase; font-family: var(--scalar-font-code);
      letter-spacing: 0.3px; flex-shrink: 0;
    }
    .method-GET { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .method-POST { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .method-PUT { background: rgba(234, 179, 8, 0.15); color: #facc15; }
    .method-PATCH { background: rgba(234, 179, 8, 0.15); color: #facc15; }
    .method-DELETE { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    /* ── Manual Content ────────────────────────── */
    .manual-content { flex: 1; min-width: 0; overflow: auto; padding: 36px 40px; scroll-padding-top: 16px; }
    .manual-content .markdown-body { max-width: 900px; margin: 0 auto; width: 100%; min-width: 0; }
    .manual-content::-webkit-scrollbar { width: 5px; }
    .manual-content::-webkit-scrollbar-track { background: transparent; }
    .manual-content::-webkit-scrollbar-thumb { background: var(--scalar-border); border-radius: 3px; }

    /* ── Markdown — using Scalar tokens ─────────── */
    .markdown-body h1 { font-size: 28px; font-weight: 700; margin-bottom: 12px; color: var(--scalar-color-1); letter-spacing: -0.4px; }
    .markdown-body h2 { font-size: 22px; font-weight: 700; margin: 28px 0 10px; color: var(--scalar-color-1); letter-spacing: -0.3px; }
    .markdown-body h3 { font-size: 17px; font-weight: 600; margin: 24px 0 8px; color: var(--scalar-color-1); }
    .markdown-body h4 { font-size: 14px; font-weight: 600; margin: 18px 0 6px; color: var(--scalar-color-1); }
    .markdown-body p { font-size: 14px; line-height: 1.7; color: var(--scalar-color-2); margin-bottom: 14px; }
    .markdown-body p,
    .markdown-body li,
    .markdown-body blockquote,
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3,
    .markdown-body h4 { overflow-wrap: break-word; }
    .markdown-body ul, .markdown-body ol { padding-left: 22px; margin-bottom: 14px; }
    .markdown-body li { font-size: 14px; line-height: 1.7; color: var(--scalar-color-2); margin-bottom: 3px; }
    .markdown-body strong { color: var(--scalar-color-1); font-weight: 600; }
    .markdown-body code {
      background: var(--scalar-background-3); padding: 2px 6px; border-radius: 4px;
      font-size: 12.5px; color: #a5b4fc; font-family: var(--scalar-font-code);
    }
    .markdown-body pre {
      background: var(--scalar-background-2); border: 1px solid var(--scalar-border);
      border-radius: 8px; padding: 14px 18px; margin: 14px 0; overflow-x: auto;
    }
    .markdown-body pre code { background: transparent; padding: 0; color: var(--scalar-color-1); font-size: 13px; line-height: 1.6; }
    .markdown-body table {
      width: max-content;
      min-width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 13px;
      display: table;
      table-layout: auto;
    }
    .markdown-body th {
      text-align: left; padding: 9px 12px; background: var(--scalar-background-3);
      border: 1px solid var(--scalar-border); color: var(--scalar-color-1);
      font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .markdown-body td {
      padding: 9px 12px;
      border: 1px solid var(--scalar-border);
      color: var(--scalar-color-2);
      line-height: 1.5;
      white-space: normal;
      word-break: normal;
      overflow-wrap: normal;
      vertical-align: top;
    }
    .markdown-body th {
      white-space: nowrap;
      vertical-align: top;
    }
    .markdown-body td:nth-child(3),
    .markdown-body th:nth-child(3) {
      max-width: min(52vw, 640px);
    }
    .markdown-body .enum-value-list {
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      line-height: 1.45;
    }
    .markdown-body tr:hover td { background: var(--scalar-background-2); }
    .markdown-body blockquote {
      border-left: 3px solid #a5b4fc; padding: 10px 14px; margin: 14px 0;
      background: rgba(165, 180, 252, 0.06); border-radius: 0 var(--scalar-radius) var(--scalar-radius) 0;
    }
    .markdown-body blockquote p { margin: 0; color: var(--scalar-color-1); }
    .markdown-body hr { border: none; border-top: 1px solid var(--scalar-border); margin: 28px 0; }

    /* ── Endpoint doc extras ───────────────────── */
    .endpoint-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .endpoint-method-badge {
      font-size: 12px; font-weight: 700; padding: 3px 8px;
      border-radius: 4px; font-family: var(--scalar-font-code);
    }
    .endpoint-path { font-size: 14px; font-family: var(--scalar-font-code); color: var(--scalar-color-2); }

    /* ── API View (iframe) ─────────────────────── */
    .api-view { display: none; height: 100%; }
    .api-view.active { display: block; }
    .api-view iframe { width: 100%; height: 100%; border: none; }

    .navbar-manual-toggle {
      display: none;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid var(--scalar-border);
      background: var(--scalar-background-3);
      color: var(--scalar-color-1);
      cursor: pointer;
      font-size: 15px;
    }

    .manual-sidebar-backdrop {
      display: none;
      position: fixed;
      inset: var(--navbar-offset) 0 0 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 89;
    }
    .manual-sidebar-backdrop.active { display: block; }

    /* ── Search Modal ──────────────────────────── */
    .search-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.6); z-index: 200;
      justify-content: center; padding-top: 15vh;
    }
    .search-overlay.active { display: flex; }
    .search-modal {
      width: 520px; max-height: 480px; background: var(--scalar-background-2);
      border: 1px solid var(--scalar-border); border-radius: 10px;
      overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
    }
    .search-input-wrapper {
      display: flex; align-items: center; padding: 12px 16px; gap: 10px;
      border-bottom: 1px solid var(--scalar-border);
    }
    .search-input-wrapper svg { width: 18px; height: 18px; color: var(--scalar-color-3); flex-shrink: 0; }
    .search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--scalar-color-1); font-size: 14px; font-family: var(--scalar-font);
    }
    .search-input::placeholder { color: var(--scalar-color-3); }
    .search-results { overflow-y: auto; padding: 6px; flex: 1; }
    .search-result-item {
      padding: 10px 12px; border-radius: var(--scalar-radius); cursor: pointer;
      display: flex; flex-direction: column; gap: 2px; transition: background var(--transition);
    }
    .search-result-item:hover, .search-result-item.selected { background: var(--scalar-background-3); }
    .search-result-title { font-size: 13px; font-weight: 500; color: var(--scalar-color-1); }
    .search-result-preview { font-size: 12px; color: var(--scalar-color-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .search-empty { padding: 24px; text-align: center; color: var(--scalar-color-3); font-size: 13px; }
    .search-footer {
      padding: 8px 16px; border-top: 1px solid var(--scalar-border);
      display: flex; gap: 12px; font-size: 11px; color: var(--scalar-color-3);
    }
    .search-footer kbd {
      padding: 1px 4px; border-radius: 3px;
      background: var(--scalar-background-4); border: 1px solid var(--scalar-border);
      font-size: 10px; font-family: inherit;
    }

    /* ── Loading indicator ─────────────────────── */
    .loading { padding: 40px; text-align: center; color: var(--scalar-color-3); font-size: 13px; }

    @media (max-width: 1024px) {
      :root { --sidebar-width: 240px; }
      .manual-content { padding: 24px 20px; }
      .search-modal { width: min(520px, calc(100vw - 20px)); }
    }

    @media (max-width: 820px) {
      .navbar { padding: 0 10px; }
      .navbar-brand { margin-right: 6px; font-size: 13px; }
      .navbar-manual-toggle { display: inline-flex; }
      .navbar-search { padding: 4px 8px; font-size: 11px; }
      .navbar-search kbd { display: none; }

      .manual-view.active { position: relative; }
      .manual-sidebar {
        position: fixed;
        top: var(--navbar-offset);
        left: 0;
        bottom: 0;
        z-index: 90;
        width: min(86vw, 320px);
        min-width: min(86vw, 320px);
        transform: translateX(-100%);
        transition: transform var(--transition);
      }
      .manual-view.sidebar-open .manual-sidebar { transform: translateX(0); }

      .manual-content { width: 100%; padding: 18px 14px; }
      .endpoint-header { flex-wrap: wrap; align-items: flex-start; }
      .endpoint-path { word-break: break-all; }
      .search-footer { flex-wrap: wrap; gap: 6px; }
    }

    @media (max-width: 640px) {
      .navbar-search {
        width: 34px;
        min-width: 34px;
        padding: 0;
        justify-content: center;
        overflow: hidden;
      }
      .navbar-search { font-size: 0; gap: 0; }
      .navbar-search kbd { display: none; }
      .navbar-tab { padding: 5px 10px; }
    }

    @media (max-width: 460px) {
      .navbar-brand {
        max-width: 120px;
        margin-right: 4px;
      }
      .navbar-tab {
        padding: 4px 8px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <!-- Navbar -->
  <nav class="navbar">
    <button class="navbar-manual-toggle" type="button" onclick="toggleManualSidebar()" aria-label="Abrir menu do manual">☰</button>
    <div class="navbar-brand">\ud83d\udcb3 ${config.title}</div>
    <div class="navbar-tabs">
      <div class="navbar-tab active" data-view="manual" onclick="switchView('manual')">\ud83d\udcd8 Manual</div>
      <div class="navbar-tab" data-view="api" onclick="switchView('api')">\u26a1 API</div>
    </div>
    <div class="navbar-spacer"></div>
    <div class="navbar-search" onclick="openSearch()">
      \ud83d\udd0d Pesquisar <kbd>Ctrl</kbd> <kbd>K</kbd>
    </div>
  </nav>

  <!-- Search Modal -->
  <div class="search-overlay" id="search-overlay" onclick="if(event.target===this)closeSearch()">
    <div class="search-modal">
      <div class="search-input-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" id="search-input" type="text" placeholder="Buscar na documenta\u00e7\u00e3o..." autocomplete="off" oninput="onSearchInput(this.value)">
      </div>
      <div class="search-results" id="search-results"></div>
      <div class="search-footer">
        <span><kbd>\u2191</kbd> <kbd>\u2193</kbd> Navegar</span>
        <span><kbd>Enter</kbd> Selecionar</span>
        <span><kbd>Esc</kbd> Fechar</span>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="content-area">
    <div class="manual-view active" id="manual-view">
      <div class="manual-sidebar-backdrop" id="manual-sidebar-backdrop" onclick="closeManualSidebar()"></div>
      <div class="manual-sidebar" id="manual-sidebar"></div>
      <div class="manual-content" id="manual-content">
        <div class="markdown-body"></div>
      </div>
    </div>
    <div class="api-view" id="api-view">
      <iframe id="scalar-iframe" loading="lazy"></iframe>
    </div>
  </div>

  <script>
    const manualTags = ${manualTagsJson};
    const scalarUrl = '${config.scalarUrl}';
    const apiSpecUrl = '${config.apiSpecUrl}';

    let activeView = 'manual';
    let scalarLoaded = false;
    let searchSelectedIndex = 0;
    let openApiSpec = null;
    let endpointsByTag = {};
    let allSearchItems = [];

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

    // ── Init ─────────────────────────────────────
    async function init() {
      syncNavbarOffset();
      renderSidebar();
      if (manualTags.length > 0) selectManualItem(0);
      await loadOpenApiSpec();
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

      const tagOrder = Object.keys(endpointsByTag).sort();

      tagOrder.forEach(tag => {
        const endpoints = endpointsByTag[tag];
        const linked = getLinkedManual(tag);
        const group = document.createElement('div');
        group.className = 'sidebar-group';

        const header = document.createElement('div');
        header.className = 'sidebar-group-header';
        header.innerHTML = '<span>' + escapeHtml(tag) + '</span><span class="arrow">\u25B6</span>';
        header.onclick = () => group.classList.toggle('open');

        const items = document.createElement('div');
        items.className = 'sidebar-group-items';

        // If there's a linked manual, add a "Vis\u00e3o Geral" item
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
        sidebar.appendChild(group);
      });
    }

    // ── Selection ────────────────────────────────
    function clearActive() {
      document.querySelectorAll('.sidebar-item.active, .sidebar-endpoint.active').forEach(el => el.classList.remove('active'));
    }

    function selectManualItem(index) {
      closeManualSidebar();
      clearActive();
      const items = document.querySelectorAll('.sidebar-item[data-type="manual"]');
      if (items[index]) items[index].classList.add('active');

      const content = document.getElementById('manual-content');
      const tag = manualTags[index];
      if (tag) {
        content.innerHTML = '<div class="markdown-body">' + marked.parse(tag.description) + '</div>';
        content.scrollTop = 0;
      }
    }

    function selectEndpoint(tag, index) {
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
      const content = document.getElementById('manual-content');
      content.innerHTML = '<div class="markdown-body">' + buildEndpointDoc(ep, tag) + '</div>';
      content.scrollTop = 0;
    }

    function selectGroupOverview(tag) {
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
      const content = document.getElementById('manual-content');
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

      content.innerHTML = '<div class="markdown-body">' + html + '</div>';
      content.scrollTop = 0;

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

      // Header with method badge + path
      md += '<div class="endpoint-header">';
      md += '<span class="endpoint-method-badge method-' + ep.method + '">' + ep.method + '</span>';
      md += '<span class="endpoint-path">' + escapeHtml(ep.path) + '</span>';
      md += '</div>';

      md += '<h1>' + escapeHtml(ep.summary || tag) + '</h1>';

      if (ep.description) {
        md += marked.parse(ep.description);
      }

      // Parameters
      if (ep.parameters && ep.parameters.length > 0) {
        md += '<h2>Par\\u00e2metros</h2>';
        md += '<table><thead><tr><th>Nome</th><th>Em</th><th>Tipo</th><th>Obrigat\\u00f3rio</th><th>Descri\\u00e7\\u00e3o</th></tr></thead><tbody>';
        ep.parameters.forEach(p => {
          const type = p.schema ? (p.schema.type || p.schema.enum ? 'enum' : '—') : '—';
          const enumVals = p.schema && p.schema.enum
            ? ' <span class="enum-value-list">(' + p.schema.enum.map(v => escapeHtml(String(v))).join(',<wbr> ') + ')</span>'
            : '';
          md += '<tr>';
          md += '<td><code>' + escapeHtml(p.name) + '</code></td>';
          md += '<td>' + escapeHtml(p.in) + '</td>';
          md += '<td>' + escapeHtml(type) + enumVals + '</td>';
          md += '<td>' + (p.required ? 'Sim' : 'N\\u00e3o') + '</td>';
          md += '<td>' + escapeHtml(p.description || '—') + '</td>';
          md += '</tr>';
        });
        md += '</tbody></table>';
      }

      // Request Body
      if (ep.requestBody) {
        md += '<h2>Corpo da Requisi\\u00e7\\u00e3o</h2>';
        const content = ep.requestBody.content;
        if (content && content['application/json']) {
          const jsonContent = content['application/json'];
          const schema = resolveSchema(jsonContent.schema);
          if (schema && schema.properties) {
            md += renderSchemaTable(schema);
          }
          // Examples
          if (jsonContent.examples) {
            md += '<h3>Exemplos</h3>';
            for (const [name, example] of Object.entries(jsonContent.examples)) {
              md += '<h4>' + escapeHtml(name) + '</h4>';
              md += '<pre><code>' + escapeHtml(JSON.stringify(example.value, null, 2)) + '</code></pre>';
            }
          }
        }
      }

      // Responses
      if (ep.responses) {
        md += '<h2>Respostas</h2>';
        for (const [status, resp] of Object.entries(ep.responses)) {
          const statusColor = status.startsWith('2') ? '#4ade80' : status.startsWith('4') ? '#facc15' : '#f87171';
          md += '<h3><span style="color:' + statusColor + '">' + status + '</span> — ' + escapeHtml(resp.description || '') + '</h3>';

          if (resp.content && resp.content['application/json']) {
            const jsonResp = resp.content['application/json'];
            const schema = resolveSchema(jsonResp.schema);
            if (schema && schema.properties) {
              md += renderSchemaTable(schema);
            }
            if (jsonResp.examples) {
              for (const [name, example] of Object.entries(jsonResp.examples)) {
                md += '<details><summary>' + escapeHtml(name) + '</summary>';
                md += '<pre><code>' + escapeHtml(JSON.stringify(example.value, null, 2)) + '</code></pre>';
                md += '</details>';
              }
            }
          }
        }
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

    function renderSchemaTable(schema) {
      let html = '<table><thead><tr><th>Campo</th><th>Tipo</th><th>Obrigat\\u00f3rio</th><th>Descri\\u00e7\\u00e3o</th></tr></thead><tbody>';
      const required = schema.required || [];
      for (const [name, prop] of Object.entries(schema.properties)) {
        const p = resolveSchema(prop) || prop;
        let type = p.type || '—';
        if (p.format) type += ' (' + p.format + ')';
        if (p.enum) type = 'enum: ' + p.enum.join(', ');
        const desc = p.description || (p.example !== undefined ? 'Ex: ' + p.example : '—');
        html += '<tr>';
        html += '<td><code>' + escapeHtml(name) + '</code></td>';
        if (p.enum) {
          html += '<td><span class="enum-value-list">' + escapeHtml(type).replaceAll(', ', ',<wbr> ') + '</span></td>';
        } else {
          html += '<td>' + escapeHtml(type) + '</td>';
        }
        html += '<td>' + (required.includes(name) ? 'Sim' : 'N\\u00e3o') + '</td>';
        html += '<td>' + escapeHtml(String(desc)) + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';
      return html;
    }

    // ── View Switch ──────────────────────────────
    function switchView(view) {
      activeView = view;
      if (view !== 'manual') closeManualSidebar();
      document.querySelectorAll('.navbar-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
      });
      document.getElementById('manual-view').classList.toggle('active', view === 'manual');
      document.getElementById('api-view').classList.toggle('active', view === 'api');
      if (view === 'api' && !scalarLoaded) {
        document.getElementById('scalar-iframe').src = scalarUrl;
        scalarLoaded = true;
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
      return md.replace(/[#*\\\`|>\\\\-]/g, '').replace(/\\\\n/g, ' ').replace(/\\\\s+/g, ' ').trim();
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
    });

    // ── Boot ─────────────────────────────────────
    init();
  ${sc}
</body>
</html>`;
}
