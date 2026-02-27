(function initDocsPortalAuthModule(globalScope) {
    function createAuthModule(deps) {
        const { getOpenApiSpec } = deps;
        function getEndpointAuthKeys(endpoint) {
            if (!endpoint || !Array.isArray(endpoint.security))
                return [];
            const keys = new Set();
            endpoint.security.forEach((entry) => {
                if (!entry || typeof entry !== 'object')
                    return;
                Object.keys(entry).forEach((key) => keys.add(key));
            });
            return Array.from(keys);
        }
        function getPrimaryAuthKey(endpoint) {
            const keys = getEndpointAuthKeys(endpoint);
            if (!keys.length)
                return 'public';
            const preferred = ['backoffice-auth', 'internal-auth', 'provider-auth'];
            const match = preferred.find((key) => keys.includes(key));
            return match || keys[0];
        }
        function getAuthGroupMeta(authKey) {
            const map = {
                'backoffice-auth': { label: 'Backoffice', order: 1 },
                'internal-auth': { label: 'Internal', order: 2 },
                'provider-auth': { label: 'Provider', order: 3 },
                public: { label: 'Público', order: 4 },
            };
            return map[authKey] || { label: authKey, order: 99 };
        }
        function getAuthLabelForEndpoint(endpoint) {
            const keys = getEndpointAuthKeys(endpoint);
            if (!keys.length)
                return 'Sem autenticação';
            const labels = keys.map((key) => getAuthGroupMeta(key).label);
            return labels.join(' / ');
        }
        function getSecurityScheme(authKey) {
            const spec = getOpenApiSpec();
            const schemes = spec && spec.components && spec.components.securitySchemes;
            return schemes && schemes[authKey] ? schemes[authKey] : null;
        }
        function getRequiredHeadersForEndpoint(endpoint) {
            const headers = [];
            const seen = new Set();
            const pushHeader = (name, source, required, description) => {
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
            (endpoint.parameters || []).forEach((parameter) => {
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
