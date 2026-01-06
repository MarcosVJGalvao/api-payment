/**
 * Extrai o nome do módulo a partir de uma URL
 * @param url URL da requisição
 * @returns Nome do módulo
 */
export function extractModuleFromUrl(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    const parts = path.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length > 0 && parts[0]) {
        return parts[0].toLowerCase();
    }
    return 'app';
}
