/**
 * Verifica se um valor é um Record (objeto não nulo e não array).
 * @param value O valor a ser verificado
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Obtém a lista de campos sensíveis a partir da variável de ambiente SENSITIVE_FIELDS.
 * Retorna ['password'] como fallback se a variável não estiver definida.
 */
function getSensitiveFields(): string[] {
    const envFields = process.env.SENSITIVE_FIELDS?.split(',').map((f) => f.trim()).filter(Boolean);
    return envFields && envFields.length > 0 ? envFields : ['password'];
}

/**
 * Higieniza um payload ocultando campos sensíveis recursivamente.
 * @param data O payload a ser higienizado
 * @param sensitiveKeys Lista de chaves a serem ocultadas (padrão: obtido de SENSITIVE_FIELDS)
 */
export function sanitizePayload(
    data: unknown,
    sensitiveKeys: string[] = getSensitiveFields(),
): unknown {
    if (Array.isArray(data)) {
        return data.map((item) => sanitizePayload(item, sensitiveKeys));
    }

    if (!isRecord(data)) return data;

    const sanitized: Record<string, unknown> = {};

    for (const key of Object.keys(data)) {
        if (sensitiveKeys.includes(key)) {
            sanitized[key] = '***REDACTED***';
        } else {
            sanitized[key] = sanitizePayload(data[key], sensitiveKeys);
        }
    }

    return sanitized;
}
