(function initDocsPortalRoutingModule(globalScope) {
    interface ManualTag {
        name: string;
        description: string;
        apiTag?: string;
    }
    interface EndpointDoc {
        method: string;
        path: string;
        [key: string]: unknown;
    }
    type EndpointsByTag = Record<string, EndpointDoc[]>;
    interface EndpointSelection {
        tag: string;
        index: number;
    }
    interface ManualSelection {
        type: 'manual';
        slug: string;
        index?: number;
        tag?: string;
    }
    interface EndpointManualSelection {
        type: 'endpoint';
        tag: string;
        index: number;
    }
    type CurrentManualSelection = ManualSelection | EndpointManualSelection | null;
    interface ApiEndpointRoute {
        type: 'endpoint';
        tagSlug: string;
        index: number;
    }
    interface ApiPortalRoute {
        type: 'portal';
    }
    type ApiRoute = ApiEndpointRoute | ApiPortalRoute;
    interface RoutingDeps {
        getManualTags: () => ManualTag[];
        getEndpointsByTag: () => EndpointsByTag;
        getActiveView: () => 'manual' | 'api';
        switchView: (view: 'manual' | 'api') => void;
        selectManualItem: (index: number) => void;
        selectEndpoint: (tag: string, index: number) => void;
        slugifyHeading: (value: string) => string;
        getCurrentManualSelection: () => CurrentManualSelection;
        getCurrentEndpointSelection: () => EndpointSelection | null;
        setScalarRouteSyncTimer: (timerId: number) => void;
        getScalarRouteSyncTimer: () => number | null;
        onSyncApiPortalUrlFromScalarSelection: () => void;
    }
    function createRoutingModule(deps: RoutingDeps) {
        const { getManualTags, getEndpointsByTag, getActiveView, switchView, selectManualItem, selectEndpoint, slugifyHeading, getCurrentManualSelection, getCurrentEndpointSelection, setScalarRouteSyncTimer, getScalarRouteSyncTimer, onSyncApiPortalUrlFromScalarSelection, } = deps;
        function slugifyManualName(name: string) {
            return slugifyHeading(name);
        }
        function slugifyEndpointTag(tag: string) {
            return slugifyHeading(tag);
        }
        function navigateToManualByName(name: string) {
            const manualTags = getManualTags();
            const index = manualTags.findIndex((tag) => tag && tag.name === name);
            if (index < 0)
                return false;
            if (getActiveView() !== 'manual') {
                switchView('manual');
            }
            selectManualItem(index);
            return true;
        }
        function navigateToManualBySlug(slug: string) {
            const manualTags = getManualTags();
            const index = manualTags.findIndex((tag) => tag && slugifyManualName(tag.name) === slug);
            if (index < 0)
                return false;
            if (getActiveView() !== 'manual') {
                switchView('manual');
            }
            selectManualItem(index);
            return true;
        }
        function getManualSlugFromPath() {
            const path = window.location.pathname || '';
            const match = path.match(/^\/docs\/manual\/([^/]+)$/);
            return match ? decodeURIComponent(match[1]) : null;
        }
        function getEndpointRouteFromPath(): { tagSlug: string; index: number } | null {
            const path = window.location.pathname || '';
            const match = path.match(/^\/docs\/endpoint\/([^/]+)\/(\d+)$/);
            if (!match)
                return null;
            return {
                tagSlug: decodeURIComponent(match[1]),
                index: Number(match[2]),
            };
        }
        function getApiPortalRouteFromPath(): ApiRoute | null {
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
        function setManualUrl(slug: string) {
            const nextPath = '/docs/manual/' + slug;
            const nextUrl = nextPath + (window.location.search || '');
            if (window.location.pathname === nextPath)
                return;
            window.history.replaceState({}, '', nextUrl);
        }
        function setEndpointUrl(tag: string, index: number) {
            const nextPath = '/docs/endpoint/' + slugifyEndpointTag(tag) + '/' + index;
            const nextUrl = nextPath + (window.location.search || '');
            if (window.location.pathname === nextPath)
                return;
            window.history.replaceState({}, '', nextUrl);
        }
        function setApiUrl() {
            const endpointSelection = getCurrentEndpointSelection();
            let nextPath = '/docs/api/portal';
            if (endpointSelection &&
                endpointSelection.tag &&
                Number.isInteger(endpointSelection.index)) {
                nextPath =
                    '/docs/api/endpoint/' +
                        slugifyEndpointTag(endpointSelection.tag) +
                        '/' +
                        endpointSelection.index;
            }
            const nextUrl = nextPath + (window.location.search || '');
            if (window.location.pathname === nextPath)
                return;
            window.history.replaceState({}, '', nextUrl);
        }
        function syncManualUrl() {
            const manualSelection = getCurrentManualSelection();
            if (manualSelection &&
                manualSelection.type === 'endpoint' &&
                manualSelection.tag &&
                Number.isInteger(manualSelection.index)) {
                setEndpointUrl(manualSelection.tag, manualSelection.index);
                return;
            }
            if (manualSelection &&
                manualSelection.type === 'manual' &&
                manualSelection.slug) {
                setManualUrl(manualSelection.slug);
                return;
            }
            const manualTags = getManualTags();
            const firstManual = manualTags[0];
            if (firstManual && firstManual.name) {
                setManualUrl(slugifyManualName(firstManual.name));
            }
        }
        function ensureManualContentRendered() {
            const manualSelection = getCurrentManualSelection();
            const manualTags = getManualTags();
            if (manualSelection &&
                manualSelection.type === 'endpoint' &&
                manualSelection.tag &&
                Number.isInteger(manualSelection.index)) {
                selectEndpoint(manualSelection.tag, manualSelection.index);
                return;
            }
            if (manualSelection &&
                manualSelection.type === 'manual' &&
                Number.isInteger(manualSelection.index)) {
                const index = manualSelection.index;
                if (typeof index === 'number') {
                    selectManualItem(index);
                }
                return;
            }
            if (manualTags.length > 0) {
                selectManualItem(0);
            }
        }
        function applyRouteFromHash() {
            const hash = window.location.hash || '';
            if (!hash.startsWith('#manual='))
                return false;
            const value = decodeURIComponent(hash.replace('#manual=', ''));
            return navigateToManualBySlug(value) || navigateToManualByName(value);
        }
        function applyRouteFromPath() {
            const apiRoute = getApiPortalRouteFromPath();
            if (apiRoute) {
                if (apiRoute.type === 'portal') {
                    if (getActiveView() !== 'api')
                        switchView('api');
                    return true;
                }
                if (apiRoute.type === 'endpoint' &&
                    apiRoute.tagSlug &&
                    Number.isInteger(apiRoute.index)) {
                    const match = Object.entries(getEndpointsByTag() || {}).find(([tag]) => slugifyEndpointTag(tag) === apiRoute.tagSlug);
                    if (match) {
                        const [tag, endpoints] = match;
                        if (apiRoute.index >= 0 && apiRoute.index < endpoints.length) {
                            selectEndpoint(tag, apiRoute.index);
                            if (getActiveView() !== 'api')
                                switchView('api');
                            return true;
                        }
                    }
                    if (getActiveView() !== 'api')
                        switchView('api');
                    return true;
                }
            }
            const endpointRoute = getEndpointRouteFromPath();
            if (endpointRoute &&
                endpointRoute.tagSlug &&
                Number.isInteger(endpointRoute.index)) {
                const match = Object.entries(getEndpointsByTag() || {}).find(([tag]) => slugifyEndpointTag(tag) === endpointRoute.tagSlug);
                if (match) {
                    const [tag, endpoints] = match;
                    if (endpointRoute.index >= 0 &&
                        endpointRoute.index < endpoints.length) {
                        if (getActiveView() !== 'manual')
                            switchView('manual');
                        selectEndpoint(tag, endpointRoute.index);
                        return true;
                    }
                }
            }
            const slug = getManualSlugFromPath();
            if (!slug)
                return false;
            return navigateToManualBySlug(slug);
        }
        function ensureScalarRouteSyncRunning() {
            if (getScalarRouteSyncTimer() != null)
                return;
            const timerId = window.setInterval(() => {
                onSyncApiPortalUrlFromScalarSelection();
            }, 700);
            setScalarRouteSyncTimer(timerId);
        }
        return {
            applyRouteFromHash,
            applyRouteFromPath,
            ensureManualContentRendered,
            ensureScalarRouteSyncRunning,
            getApiPortalRouteFromPath,
            getEndpointRouteFromPath,
            getManualSlugFromPath,
            navigateToManualByName,
            navigateToManualBySlug,
            setApiUrl,
            setEndpointUrl,
            setManualUrl,
            slugifyEndpointTag,
            slugifyManualName,
            syncManualUrl,
        };
    }
    globalScope.DocsPortalRouting = {
        createRoutingModule,
    };
})(window);
