/**
 * Calcula os metadados de paginação
 * @param page - Página atual
 * @param limit - Limite de itens por página
 * @param total - Total de itens
 * @returns Metadados de paginação
 * @example
 * calculatePaginationMeta(2, 10, 45);
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number,
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
