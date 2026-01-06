import * as winston from 'winston';

/**
 * Cria um replacer para JSON.stringify que lida com referências circulares
 * @returns Função replacer que substitui referências circulares por '[Circular]'
 */
function getCircularReplacer(): (key: string, value: unknown) => unknown {
    const seen = new WeakSet();
    return (_key: string, value: unknown): unknown => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    };
}

/**
 * Serializa objeto para JSON de forma segura, tratando referências circulares
 * @param obj Objeto a ser serializado
 * @param space Espaçamento para indentação (opcional)
 */
function safeStringify(obj: unknown, space?: number): string {
    try {
        return JSON.stringify(obj, getCircularReplacer(), space);
    } catch {
        return '[Unable to stringify]';
    }
}

/** Cria o formato de console colorido para desenvolvimento */
export function createConsoleFormat(): winston.Logform.Format {
    return winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
            const contextStr = context && typeof context === 'string' ? `[${context}]` : '';
            const metaWithStack = stack ? { ...meta, stack } : meta;
            const metaStr = Object.keys(metaWithStack).length
                ? safeStringify(metaWithStack, 2)
                : '';
            return `${String(timestamp)} ${String(level)} ${contextStr} ${String(message)} ${metaStr}`;
        }),
    );
}

/** Cria o formato JSON formatado para produção (com tratamento de referências circulares) */
export function createJsonFormat(): winston.Logform.Format {
    return winston.format.printf((info) => {
        return safeStringify(info, 2);
    });
}

/**
 * Cria o formato base do logger
 * @param isProduction Se true, usa JSON format; se false, usa console colorido
 */
export function createLoggerFormat(isProduction: boolean): winston.Logform.Format {
    return winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        isProduction ? createJsonFormat() : createConsoleFormat(),
    );
}
