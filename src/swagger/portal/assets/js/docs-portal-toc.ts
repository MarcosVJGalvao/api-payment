(function initDocsPortalTocModule(globalScope) {
    function createTocModule(deps) {
        const { getActiveView, getManualTocItems, setManualTocItems, escapeHtml, slugifyHeading, } = deps;
        function setActiveTocItem(index) {
            const tocList = document.getElementById('manual-toc-list');
            if (!tocList)
                return;
            tocList.querySelectorAll('.manual-toc-item').forEach((element, itemIndex) => {
                element.classList.toggle('active', itemIndex === index);
            });
        }
        function updateManualTocActive() {
            const content = document.getElementById('manual-content');
            const manualTocItems = getManualTocItems();
            if (!content || !manualTocItems.length)
                return;
            const contentRect = content.getBoundingClientRect();
            const anchorLine = contentRect.top + 40;
            let activeIndex = 0;
            manualTocItems.forEach((item, itemIndex) => {
                const rect = item.el.getBoundingClientRect();
                if (rect.top <= anchorLine)
                    activeIndex = itemIndex;
            });
            setActiveTocItem(activeIndex);
        }
        function bindManualTocScrollSpy() {
            const content = document.getElementById('manual-content');
            if (!content || content.dataset.tocSpyBound === 'true')
                return;
            content.addEventListener('scroll', () => {
                if (getActiveView() === 'manual')
                    updateManualTocActive();
            });
            content.dataset.tocSpyBound = 'true';
        }
        function decorateHeadingAnchors() {
            const content = document.getElementById('manual-content');
            if (!content)
                return;
            const headings = content.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
            headings.forEach((heading, index) => {
                const text = (heading.textContent || '').trim();
                if (!text)
                    return;
                const tagName = (heading.tagName || '').toLowerCase();
                if (tagName === 'h1')
                    return;
                if (!heading.id) {
                    heading.id = slugifyHeading(text) || 'section-' + index;
                }
                if (heading.querySelector('.heading-anchor-link'))
                    return;
                const anchor = document.createElement('a');
                anchor.className = 'heading-anchor-link';
                anchor.href = '#' + heading.id;
                anchor.setAttribute('aria-label', 'Link para esta seção');
                anchor.setAttribute('title', 'Link para esta seção');
                anchor.innerHTML =
                    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                        '<path fill="currentColor" d="M12 2a2.25 2.25 0 1 1 0 4.5A2.25 2.25 0 0 1 12 2Zm-1 5.5h2v8.25a3.75 3.75 0 0 0 2.92-2.72l-1.48-.74a1 1 0 1 1 .9-1.78l2.73 1.36a1 1 0 0 1 .47 1.28A5.75 5.75 0 0 1 13 17.84V20h2.5a1 1 0 1 1 0 2h-7a1 1 0 1 1 0-2H11v-2.16a5.75 5.75 0 0 1-5.46-4.97a1 1 0 0 1 .56-1.01l2.73-1.36a1 1 0 1 1 .9 1.78l-1.5.75A3.75 3.75 0 0 0 11 15.75V7.5Z"></path>' +
                        '</svg>';
                anchor.addEventListener('click', (event) => {
                    event.preventDefault();
                    const hash = '#' + heading.id;
                    const nextUrl = window.location.pathname + (window.location.search || '') + hash;
                    window.history.replaceState({}, '', nextUrl);
                    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                heading.classList.add('has-heading-anchor');
                heading.insertBefore(anchor, heading.firstChild);
            });
        }
        function buildManualToc() {
            const content = document.getElementById('manual-content');
            const tocList = document.getElementById('manual-toc-list');
            if (!content || !tocList)
                return;
            const allHeadings = Array.from(content.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4'));
            const hasNonH1Heading = allHeadings.some((element) => (element.tagName || '').toLowerCase() !== 'h1');
            const headings = hasNonH1Heading
                ? allHeadings.filter((element) => (element.tagName || '').toLowerCase() !== 'h1')
                : allHeadings;
            const tocCandidates = [];
            const usedIds = new Set();
            let firstLevel = null;
            let secondLevel = null;
            headings.forEach((element, index) => {
                const tag = (element.tagName || '').toLowerCase();
                const rawLevel = Number(tag.replace('h', '')) || 2;
                const text = (element.textContent || '').trim();
                if (!text)
                    return;
                if (element.classList.contains('endpoint-path'))
                    return;
                if (element.closest && element.closest('.enum-definitions-section'))
                    return;
                if (!element.id) {
                    let base = slugifyHeading(text) || 'section-' + index;
                    let finalId = base;
                    let sequence = 2;
                    while (usedIds.has(finalId) || document.getElementById(finalId)) {
                        finalId = base + '-' + sequence++;
                    }
                    element.id = finalId;
                    usedIds.add(finalId);
                }
                else {
                    usedIds.add(element.id);
                }
                if (firstLevel === null)
                    firstLevel = rawLevel;
                if (rawLevel === firstLevel) {
                    tocCandidates.push({ id: element.id, text, level: 1, el: element });
                    return;
                }
                if (rawLevel > firstLevel) {
                    if (secondLevel === null) {
                        secondLevel = rawLevel;
                    }
                    if (rawLevel !== secondLevel) {
                        return;
                    }
                    tocCandidates.push({ id: element.id, text, level: 2, el: element });
                }
            });
            setManualTocItems(tocCandidates);
            const manualTocItems = getManualTocItems();
            if (!manualTocItems.length) {
                tocList.innerHTML = '<div class="manual-toc-empty">Sem tópicos</div>';
                return;
            }
            tocList.innerHTML = manualTocItems
                .map((item, index) => '<button type="button" class="manual-toc-item level-' +
                item.level +
                '" data-toc-index="' +
                index +
                '" title="' +
                escapeHtml(item.text) +
                '">' +
                escapeHtml(item.text) +
                '</button>')
                .join('');
            tocList.querySelectorAll('.manual-toc-item').forEach((button) => {
                button.addEventListener('click', () => {
                    const idx = Number(button.dataset.tocIndex);
                    const selectedItem = getManualTocItems()[idx];
                    if (!selectedItem)
                        return;
                    selectedItem.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveTocItem(idx);
                });
            });
            bindManualTocScrollSpy();
            updateManualTocActive();
        }
        function renderManualHtml(html) {
            const content = document.getElementById('manual-content');
            if (!content)
                return;
            content.innerHTML = '<div class="markdown-body">' + html + '</div>';
            content.scrollTop = 0;
            decorateHeadingAnchors();
            buildManualToc();
        }
        return {
            bindManualTocScrollSpy,
            buildManualToc,
            decorateHeadingAnchors,
            renderManualHtml,
            setActiveTocItem,
            updateManualTocActive,
        };
    }
    globalScope.DocsPortalToc = {
        createTocModule,
    };
})(window);
