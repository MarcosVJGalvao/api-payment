(function initDocsPortalSearchModule(globalScope) {
    function createSearchModule(deps) {
        const { getManualTags, getEndpointsByTag, getActiveView, switchView, selectManualItem, selectEndpoint, escapeHtml, stripMd, getSearchSelectedIndex, setSearchSelectedIndex, getAllSearchItems, setAllSearchItems, } = deps;
        function buildSearchIndex() {
            const items = [];
            getManualTags().forEach((tag, index) => {
                items.push({
                    type: 'manual',
                    title: tag.name,
                    preview: stripMd(tag.description).substring(0, 120),
                    action: () => selectManualItem(index),
                });
            });
            for (const [tag, endpoints] of Object.entries(getEndpointsByTag())) {
                endpoints.forEach((endpoint, index) => {
                    items.push({
                        type: 'endpoint',
                        title: endpoint.method + ' ' + (endpoint.summary || endpoint.path),
                        preview: tag + ' - ' + (endpoint.description || endpoint.path).substring(0, 100),
                        action: () => {
                            if (getActiveView() !== 'manual')
                                switchView('manual');
                            selectEndpoint(tag, index);
                        },
                    });
                });
            }
            setAllSearchItems(items);
        }
        function onSearchInput(query) {
            const results = document.getElementById('search-results');
            if (!results)
                return;
            const normalizedQuery = query.toLowerCase().trim();
            const sourceItems = getAllSearchItems();
            const items = normalizedQuery
                ? sourceItems.filter((item) => item.title.toLowerCase().includes(normalizedQuery) ||
                    item.preview.toLowerCase().includes(normalizedQuery))
                : sourceItems.slice(0, 20);
            if (!items.length) {
                results.innerHTML =
                    '<div class="search-empty">Nenhum resultado para "' +
                        escapeHtml(query) +
                        '"</div>';
                return;
            }
            results.innerHTML = items
                .map((item, index) => '<div class="search-result-item' +
                (index === 0 ? ' selected' : '') +
                '" data-idx="' +
                index +
                '">' +
                '<div class="search-result-title">' +
                escapeHtml(item.title) +
                '</div>' +
                '<div class="search-result-preview">' +
                escapeHtml(item.preview) +
                '</div>' +
                '</div>')
                .join('');
            results.querySelectorAll('.search-result-item').forEach((element, index) => {
                element.onclick = () => {
                    closeSearch();
                    items[index].action();
                };
            });
            setSearchSelectedIndex(0);
        }
        function openSearch() {
            const overlay = document.getElementById('search-overlay');
            const input = document.getElementById('search-input');
            if (!overlay || !input)
                return;
            overlay.classList.add('active');
            input.value = '';
            input.focus();
            onSearchInput('');
        }
        function closeSearch() {
            const overlay = document.getElementById('search-overlay');
            if (!overlay)
                return;
            overlay.classList.remove('active');
        }
        function bindKeyboardShortcuts() {
            document.addEventListener('keydown', (event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                    event.preventDefault();
                    openSearch();
                    return;
                }
                if (event.key === 'Escape') {
                    closeSearch();
                    return;
                }
                const overlay = document.getElementById('search-overlay');
                if (!overlay || !overlay.classList.contains('active'))
                    return;
                const items = overlay.querySelectorAll('.search-result-item');
                if (!items.length)
                    return;
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    const nextIndex = Math.min(getSearchSelectedIndex() + 1, items.length - 1);
                    setSearchSelectedIndex(nextIndex);
                    items.forEach((element, index) => {
                        element.classList.toggle('selected', index === nextIndex);
                    });
                    items[nextIndex].scrollIntoView({ block: 'nearest' });
                    return;
                }
                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    const nextIndex = Math.max(getSearchSelectedIndex() - 1, 0);
                    setSearchSelectedIndex(nextIndex);
                    items.forEach((element, index) => {
                        element.classList.toggle('selected', index === nextIndex);
                    });
                    items[nextIndex].scrollIntoView({ block: 'nearest' });
                    return;
                }
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const selected = items[getSearchSelectedIndex()];
                    if (selected && selected.click)
                        selected.click();
                }
            });
        }
        return {
            bindKeyboardShortcuts,
            buildSearchIndex,
            closeSearch,
            onSearchInput,
            openSearch,
        };
    }
    globalScope.DocsPortalSearch = {
        createSearchModule,
    };
})(window);
