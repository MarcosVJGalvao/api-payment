import { HiperbancoRequestOptions } from '../interfaces/hiperbanco-responses.interface';

/**
 * Retorna os cabeçalhos padrão exigidos pela API do Hiperbanco.
 */
export function getDefaultHeaders(): Record<string, string> {
    return {
        version: 'cutting-edge',
        'Content-Type': 'application/json',
    };
}

/**
 * Constrói o objeto final de cabeçalhos mesclando padrões com sobrescritas opcionais.
 * @param options Opções da requisição contendo cabeçalhos personalizados
 */
export function buildHeaders(options?: HiperbancoRequestOptions): Record<string, string> {
    return {
        ...getDefaultHeaders(),
        ...options?.headers,
    };
}
