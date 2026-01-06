/**
 * Tipos de valores aceitos em filtros
 *
 * Suporta tipos primitivos e arrays desses tipos
 */
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | null
  | string[]
  | number[]
  | boolean[]
  | Date[]
  | [any, any]; // Para operador BETWEEN

/**
 * Tipo auxiliar para valores de filtro que podem ser undefined
 */
export type OptionalFilterValue = FilterValue | undefined;
