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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js">${sc}
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
      --scalar-color-accent: #fafafa;
      --scalar-color-accent-hover: #fafafa;
      --scalar-border: rgba(255, 255, 255, 0.16);
      --scalar-radius: 6px;
      --scalar-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --scalar-font-code: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace;
      --navbar-height: 48px;
      --sidebar-width: 260px;
      --transition: 150ms ease;
    }

    body {
      font-family: var(--scalar-font);
      background: var(--scalar-background-1);
      color: var(--scalar-color-1);
      height: 100vh;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── Navbar ─────────────────────────────────── */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--navbar-height);
      background: var(--scalar-background-2);
      border-bottom: 1px solid var(--scalar-border);
      display: flex;
      align-items: center;
      padding: 0 20px;
      z-index: 100;
      gap: 6px;
    }

    .navbar-brand {
      font-weight: 700;
      font-size: 14px;
      color: var(--scalar-color-1);
      margin-right: 24px;
      white-space: nowrap;
      letter-spacing: -0.3px;
    }

    .navbar-tabs {
      display: flex;
      gap: 2px;
    }

    .navbar-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: var(--scalar-radius);
      font-size: 13px;
      font-weight: 500;
      color: var(--scalar-color-2);
      cursor: pointer;
      transition: all var(--transition);
      border: 1px solid transparent;
      background: transparent;
      user-select: none;
    }

    .navbar-tab:hover {
      color: var(--scalar-color-1);
      background: var(--scalar-background-3);
    }

    .navbar-tab.active {
      color: #fff;
      background: var(--scalar-background-3);
      border-color: var(--scalar-border);
    }

    .navbar-spacer { flex: 1; }

    .navbar-search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      border-radius: var(--scalar-radius);
      background: var(--scalar-background-3);
      border: 1px solid var(--scalar-border);
      color: var(--scalar-color-3);
      font-size: 12px;
      cursor: pointer;
      transition: border-color var(--transition);
    }

    .navbar-search:hover {
      border-color: var(--scalar-color-3);
    }

    .navbar-search kbd {
      padding: 1px 5px;
      border-radius: 3px;
      background: var(--scalar-background-4);
      border: 1px solid var(--scalar-border);
      font-size: 10px;
      font-family: inherit;
    }

    /* ── Content Area ──────────────────────────── */
    .content-area {
      margin-top: var(--navbar-height);
      height: calc(100vh - var(--navbar-height));
    }

    /* ── Manual View ───────────────────────────── */
    .manual-view {
      display: none;
      height: 100%;
    }

    .manual-view.active {
      display: flex;
    }

    .manual-sidebar {
      width: var(--sidebar-width);
      min-width: var(--sidebar-width);
      height: 100%;
      background: var(--scalar-background-2);
      border-right: 1px solid var(--scalar-border);
      overflow-y: auto;
      padding: 12px 0;
    }

    .manual-sidebar::-webkit-scrollbar { width: 4px; }
    .manual-sidebar::-webkit-scrollbar-track { background: transparent; }
    .manual-sidebar::-webkit-scrollbar-thumb { background: var(--scalar-border); border-radius: 2px; }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 13px;
      color: var(--scalar-color-2);
      cursor: pointer;
      transition: all var(--transition);
      border-left: 2px solid transparent;
    }

    .sidebar-item:hover {
      color: var(--scalar-color-1);
      background: var(--scalar-background-3);
    }

    .sidebar-item.active {
      color: var(--scalar-color-1);
      background: var(--scalar-background-2);
      border-left-color: var(--scalar-color-1);
      font-weight: 500;
    }

    .sidebar-section-title {
      padding: 16px 16px 6px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--scalar-color-3);
    }

    .sidebar-section-title:first-child {
      padding-top: 6px;
    }

    /* ── Manual Content ────────────────────────── */
    .manual-content {
      flex: 1;
      overflow-y: auto;
      padding: 36px 40px;
    }

    .manual-content .markdown-body {
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    .manual-content::-webkit-scrollbar { width: 5px; }
    .manual-content::-webkit-scrollbar-track { background: transparent; }
    .manual-content::-webkit-scrollbar-thumb { background: var(--scalar-border); border-radius: 3px; }

    /* ── Markdown — usando tokens Scalar ───────── */
    .markdown-body h2 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 10px;
      color: var(--scalar-color-1);
      letter-spacing: -0.4px;
    }

    .markdown-body h3 {
      font-size: 17px;
      font-weight: 600;
      margin: 28px 0 10px;
      color: var(--scalar-color-1);
    }

    .markdown-body p {
      font-size: 14px;
      line-height: 1.7;
      color: var(--scalar-color-2);
      margin-bottom: 14px;
    }

    .markdown-body ul, .markdown-body ol {
      padding-left: 22px;
      margin-bottom: 14px;
    }

    .markdown-body li {
      font-size: 14px;
      line-height: 1.7;
      color: var(--scalar-color-2);
      margin-bottom: 3px;
    }

    .markdown-body strong {
      color: var(--scalar-color-1);
      font-weight: 600;
    }

    .markdown-body code {
      background: var(--scalar-background-3);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12.5px;
      color: #a5b4fc;
      font-family: var(--scalar-font-code);
    }

    .markdown-body pre {
      background: var(--scalar-background-2);
      border: 1px solid var(--scalar-border);
      border-radius: 8px;
      padding: 14px 18px;
      margin: 14px 0;
      overflow-x: auto;
    }

    .markdown-body pre code {
      background: transparent;
      padding: 0;
      color: var(--scalar-color-1);
      font-size: 13px;
      line-height: 1.6;
    }

    .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 13px;
    }

    .markdown-body th {
      text-align: left;
      padding: 9px 12px;
      background: var(--scalar-background-3);
      border: 1px solid var(--scalar-border);
      color: var(--scalar-color-1);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .markdown-body td {
      padding: 9px 12px;
      border: 1px solid var(--scalar-border);
      color: var(--scalar-color-2);
      line-height: 1.5;
    }

    .markdown-body tr:hover td {
      background: var(--scalar-background-3);
    }

    .markdown-body blockquote {
      border-left: 3px solid #a5b4fc;
      padding: 10px 14px;
      margin: 14px 0;
      background: rgba(165, 180, 252, 0.06);
      border-radius: 0 var(--scalar-radius) var(--scalar-radius) 0;
    }

    .markdown-body blockquote p {
      margin: 0;
      color: var(--scalar-color-1);
    }

    .markdown-body hr {
      border: none;
      border-top: 1px solid var(--scalar-border);
      margin: 28px 0;
    }

    /* ── API View (iframe) ─────────────────────── */
    .api-view {
      display: none;
      height: 100%;
    }

    .api-view.active {
      display: block;
    }

    .api-view iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    /* ── Search Modal ──────────────────────────── */
    .search-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 200;
      justify-content: center;
      padding-top: 15vh;
    }

    .search-overlay.active {
      display: flex;
    }

    .search-modal {
      width: 520px;
      max-height: 480px;
      background: var(--scalar-background-2);
      border: 1px solid var(--scalar-border);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
    }

    .search-input-wrapper {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      gap: 10px;
      border-bottom: 1px solid var(--scalar-border);
    }

    .search-input-wrapper svg {
      width: 18px;
      height: 18px;
      color: var(--scalar-color-3);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--scalar-color-1);
      font-size: 14px;
      font-family: var(--scalar-font);
    }

    .search-input::placeholder {
      color: var(--scalar-color-3);
    }

    .search-results {
      overflow-y: auto;
      padding: 6px;
      flex: 1;
    }

    .search-result-item {
      padding: 10px 12px;
      border-radius: var(--scalar-radius);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: background var(--transition);
    }

    .search-result-item:hover,
    .search-result-item.selected {
      background: var(--scalar-background-3);
    }

    .search-result-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--scalar-color-1);
    }

    .search-result-preview {
      font-size: 12px;
      color: var(--scalar-color-3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-empty {
      padding: 24px;
      text-align: center;
      color: var(--scalar-color-3);
      font-size: 13px;
    }

    .search-footer {
      padding: 8px 16px;
      border-top: 1px solid var(--scalar-border);
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--scalar-color-3);
    }

    .search-footer kbd {
      padding: 1px 4px;
      border-radius: 3px;
      background: var(--scalar-background-4);
      border: 1px solid var(--scalar-border);
      font-size: 10px;
      font-family: inherit;
    }
  </style>
</head>
<body>
  <!-- Navbar -->
  <nav class="navbar">
    <div class="navbar-brand">\ud83d\udcb3 ${config.title}</div>
    <div class="navbar-tabs">
      <div class="navbar-tab active" data-view="manual" onclick="switchView('manual')">
        \ud83d\udcd8 Manual
      </div>
      <div class="navbar-tab" data-view="api" onclick="switchView('api')">
        \u26a1 API
      </div>
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

    let activeView = 'manual';
    let scalarLoaded = false;
    let searchSelectedIndex = 0;

    // ── Sidebar ──────────────────────────────────
    function renderSidebar() {
      const sidebar = document.getElementById('manual-sidebar');

      const title = document.createElement('div');
      title.className = 'sidebar-section-title';
      title.textContent = 'Documenta\u00e7\u00e3o';
      sidebar.appendChild(title);

      manualTags.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'sidebar-item' + (index === 0 ? ' active' : '');
        item.textContent = tag.name;
        item.onclick = () => selectManualItem(index);
        sidebar.appendChild(item);
      });

      if (manualTags.length > 0) selectManualItem(0);
    }

    function selectManualItem(index) {
      document.querySelectorAll('.sidebar-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
      });

      const content = document.getElementById('manual-content');
      const tag = manualTags[index];
      if (tag) {
        content.innerHTML = '<div class="markdown-body">' + marked.parse(tag.description) + '</div>';
        content.scrollTop = 0;
      }
    }

    // ── View Switch ──────────────────────────────
    function switchView(view) {
      activeView = view;

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
    function openSearch() {
      const overlay = document.getElementById('search-overlay');
      overlay.classList.add('active');
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

      if (!q) {
        results.innerHTML = manualTags.map((tag, i) =>
          '<div class="search-result-item' + (i === 0 ? ' selected' : '') + '" data-index="' + i + '" onclick="selectSearchResult(' + i + ')">' +
            '<div class="search-result-title">' + tag.name + '</div>' +
            '<div class="search-result-preview">' + stripMd(tag.description).substring(0, 100) + '</div>' +
          '</div>'
        ).join('');
        searchSelectedIndex = 0;
        return;
      }

      const matches = manualTags
        .map((tag, i) => ({ tag, index: i, text: stripMd(tag.description) }))
        .filter(m => m.tag.name.toLowerCase().includes(q) || m.text.toLowerCase().includes(q));

      if (matches.length === 0) {
        results.innerHTML = '<div class="search-empty">Nenhum resultado para "' + escapeHtml(query) + '"</div>';
        return;
      }

      results.innerHTML = matches.map((m, i) => {
        let preview = m.text.substring(0, 120);
        const pos = m.text.toLowerCase().indexOf(q);
        if (pos > 20) {
          preview = '...' + m.text.substring(pos - 20, pos + 100);
        }
        return '<div class="search-result-item' + (i === 0 ? ' selected' : '') + '" data-index="' + m.index + '" onclick="selectSearchResult(' + m.index + ')">' +
          '<div class="search-result-title">' + m.tag.name + '</div>' +
          '<div class="search-result-preview">' + escapeHtml(preview) + '</div>' +
        '</div>';
      }).join('');

      searchSelectedIndex = 0;
    }

    function selectSearchResult(index) {
      closeSearch();
      if (activeView !== 'manual') switchView('manual');
      selectManualItem(index);
    }

    function stripMd(md) {
      return md.replace(/[#*\`|>\\-]/g, '').replace(/\\n/g, ' ').replace(/\\s+/g, ' ').trim();
    }

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    // ── Keyboard ─────────────────────────────────
    document.addEventListener('keydown', (e) => {
      // Ctrl+K → Abrir busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
        return;
      }

      // Esc → Fechar busca
      if (e.key === 'Escape') {
        closeSearch();
        return;
      }

      // Arrow keys e Enter na busca
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
        if (selected) {
          selectSearchResult(parseInt(selected.dataset.index));
        }
      }
    });

    // ── Init ─────────────────────────────────────
    renderSidebar();
  ${sc}
</body>
</html>`;
}
