/**
 * Verifica se um valor é um Record (objeto não nulo e não array).
 * @param value O valor a ser verificado
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Higieniza um payload ocultando campos sensíveis como password.
 * @param data O payload a ser higienizado
 * @param sensitiveKeys Lista de chaves a serem ocultadas (padrão: ['password'])
 */
export function sanitizePayload(data: unknown, sensitiveKeys: string[] = ['password']): Record<string, unknown> {
    if (!isRecord(data)) return {};
    const sanitized = { ...data };

    sensitiveKeys.forEach(key => {
        if (key in sanitized) {
            sanitized[key] = '***REDACTED***';
        }
    });

    return sanitized;
}
