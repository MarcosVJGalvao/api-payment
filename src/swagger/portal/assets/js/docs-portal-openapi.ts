(function initDocsPortalOpenApiModule(globalScope) {
    interface OpenApiOperation {
        tags?: string[];
        [key: string]: unknown;
    }
    interface OpenApiSpec {
        paths?: Record<string, Record<string, OpenApiOperation>>;
    }
    interface EndpointDoc extends OpenApiOperation {
        method: string;
        path: string;
    }
    type EndpointsByTag = Record<string, EndpointDoc[]>;
    interface OpenApiDeps {
        getApiSpecUrl: () => string;
        onSpecLoaded: (spec: OpenApiSpec, grouped: EndpointsByTag) => void;
        onSpecLoadError: (error: unknown) => void;
    }
    function createOpenApiModule(deps: OpenApiDeps) {
        const { getApiSpecUrl, onSpecLoaded, onSpecLoadError, } = deps;
        async function loadOpenApiSpec() {
            try {
                const res = await fetch(getApiSpecUrl());
                const spec = (await res.json()) as OpenApiSpec;
                const endpointsByTag = groupEndpointsByTag(spec);
                onSpecLoaded(spec, endpointsByTag);
            }
            catch (error) {
                onSpecLoadError(error);
            }
        }
        function groupEndpointsByTag(spec: OpenApiSpec): EndpointsByTag {
            const groups: EndpointsByTag = {};
            for (const [path, methods] of Object.entries(spec.paths || {})) {
                for (const [method, operation] of Object.entries(methods)) {
                    if (!operation || !Array.isArray(operation.tags))
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
