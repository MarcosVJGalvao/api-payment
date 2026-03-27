(function portalUtilsBootstrap(globalScope) {
    function slugifyHeading(text: string) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    function stripMd(md: string) {
        return String(md || '').replace(/[#*_`>\-\[\]()]/g, '').replace(/\n+/g, ' ');
    }
    function escapeHtml(value: string) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    globalScope.PortalUtils = {
        slugifyHeading: slugifyHeading,
        stripMd: stripMd,
        escapeHtml: escapeHtml,
    };
})(window);
