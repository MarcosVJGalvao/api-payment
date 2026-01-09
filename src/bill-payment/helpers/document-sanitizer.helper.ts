/**
 * Helpers para sanitização de documentos (CPF/CNPJ).
 */

/**
 * Remove caracteres não numéricos de um documento, mantendo apenas os dígitos.
 * Útil para padronizar documentos que podem vir mascarados (ex: 87.754.347/0001-08)
 * ou já sem máscara (ex: 87754347000108).
 *
 * @param document - Documento a ser sanitizado (CPF, CNPJ, etc.)
 * @returns Documento contendo apenas números, ou undefined se input for inválido
 */
export function sanitizeDocument(
  document: string | undefined | null,
): string | undefined {
  if (!document) {
    return undefined;
  }

  const sanitized = document.replace(/\D/g, '');

  return sanitized.length > 0 ? sanitized : undefined;
}
