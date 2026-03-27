(function initDocsPortalAuthModule(globalScope) {
    interface SecurityScheme {
        type?: string;
        scheme?: string;
        in?: string;
        name?: string;
        description?: string;
    }
    interface HeaderParameter {
        name: string;
        in: string;
        required?: boolean;
        description?: string;
    }
    interface EndpointDoc {
        security?: Array<Record<string, unknown>>;
        parameters?: HeaderParameter[];
    }
    interface OpenApiSpec {
        components?: {
            securitySchemes?: Record<string, SecurityScheme>;
        };
    }
    interface HeaderRequirement {
        name: string;
        source: 'auth' | 'parameter';
        required: boolean;
        description?: string;
    }
    interface AuthDeps {
        getOpenApiSpec: () => OpenApiSpec | null;
    }
    function createAuthModule(deps: AuthDeps) {
        const { getOpenApiSpec } = deps;
        function getEndpointAuthKeys(endpoint: EndpointDoc | null | undefined) {
            if (!endpoint || !Array.isArray(endpoint.security))
                return [];
            const keys = new Set<string>();
            endpoint.security.forEach((entry: Record<string, unknown>) => {
                if (!entry || typeof entry !== 'object')
                    return;
                Object.keys(entry).forEach((key) => keys.add(key));
            });
            return Array.from(keys);
        }
        function getPrimaryAuthKey(endpoint: EndpointDoc | null | undefined) {
            const keys = getEndpointAuthKeys(endpoint);
            if (!keys.length)
                return 'public';
            const preferred = ['backoffice-auth', 'internal-auth', 'provider-auth'];
            const match = preferred.find((key) => keys.includes(key));
            return match || keys[0];
        }
        function getAuthGroupMeta(authKey: string) {
            const map = {
                'backoffice-auth': { label: 'Backoffice', order: 1 },
                'internal-auth': { label: 'Internal', order: 2 },
                'provider-auth': { label: 'Provider', order: 3 },
                public: { label: 'Público', order: 4 },
            };
            return map[authKey as keyof typeof map] || { label: authKey, order: 99 };
        }
        function getAuthLabelForEndpoint(endpoint: EndpointDoc | null | undefined) {
            const keys = getEndpointAuthKeys(endpoint);
            if (!keys.length)
                return 'Sem autenticação';
            const labels = keys.map((key) => getAuthGroupMeta(key).label);
            return labels.join(' / ');
        }
        function getSecurityScheme(authKey: string) {
            const spec = getOpenApiSpec();
            const schemes = spec && spec.components && spec.components.securitySchemes;
            return schemes && schemes[authKey] ? schemes[authKey] : null;
        }
        function getRequiredHeadersForEndpoint(endpoint: EndpointDoc | null | undefined) {
            const headers: HeaderRequirement[] = [];
            const seen = new Set<string>();
            const pushHeader = (name: string, source: 'auth' | 'parameter', required: boolean, description?: string) => {
                const key = String(name).toLowerCase();
                if (seen.has(key))
                    return;
                seen.add(key);
                headers.push({ name, source, required, description });
            };
            getEndpointAuthKeys(endpoint).forEach((authKey) => {
                const scheme = getSecurityScheme(authKey);
                if (!scheme)
                    return;
                if (scheme.type === 'http' && scheme.scheme === 'bearer') {
                    pushHeader('Authorization', 'auth', true, 'Bearer <token> (' + getAuthGroupMeta(authKey).label + ')');
                    return;
                }
                if (scheme.type === 'apiKey' && scheme.in === 'header' && scheme.name) {
                    pushHeader(scheme.name, 'auth', true, scheme.description ||
                        'Header de autenticação (' + getAuthGroupMeta(authKey).label + ')');
                }
            });
            (endpoint?.parameters || []).forEach((parameter: HeaderParameter) => {
                if (!parameter || parameter.in !== 'header')
                    return;
                pushHeader(parameter.name, 'parameter', Boolean(parameter.required), parameter.description || 'Header da requisição');
            });
            return headers;
        }
        return {
            getAuthGroupMeta,
            getAuthLabelForEndpoint,
            getEndpointAuthKeys,
            getPrimaryAuthKey,
            getRequiredHeadersForEndpoint,
            getSecurityScheme,
        };
    }
    globalScope.DocsPortalAuth = {
        createAuthModule,
    };
})(window);
