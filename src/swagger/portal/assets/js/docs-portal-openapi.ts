(function initDocsPortalOpenApiModule(globalScope) {
    function createOpenApiModule(deps) {
        const { getApiSpecUrl, onSpecLoaded, onSpecLoadError, } = deps;
        async function loadOpenApiSpec() {
            try {
                const res = await fetch(getApiSpecUrl());
                const spec = await res.json();
                const endpointsByTag = groupEndpointsByTag(spec);
                onSpecLoaded(spec, endpointsByTag);
            }
            catch (error) {
                onSpecLoadError(error);
            }
        }
        function groupEndpointsByTag(spec) {
            const groups = {};
            for (const [path, methods] of Object.entries(spec.paths || {})) {
                for (const [method, operation] of Object.entries(methods)) {
                    if (!operation || !operation.tags)
                        continue;
                    for (const tag of operation.tags) {
                        if (!groups[tag])
                            groups[tag] = [];
                        groups[tag].push({ method: method.toUpperCase(), path, ...operation });
                    }
                }
            }
            return groups;
        }
        return {
            groupEndpointsByTag,
            loadOpenApiSpec,
        };
    }
    globalScope.DocsPortalOpenApi = {
        createOpenApiModule,
    };
})(window);
