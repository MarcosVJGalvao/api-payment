import 'reflect-metadata';
import { FilterOperator } from '../enums/filter-operator.enum';

export const QUERY_FILTER_METADATA_KEY = 'query:filter';

export interface QueryFilterOptions {
  operator?: FilterOperator;
  relation?: string;
  ignore?: boolean;
}

/**
 * Decorator para marcar campos do DTO como filtros
 * @param options - Opções de configuração do filtro
 * @returns Decorator function
 */
export function QueryFilter(options?: QueryFilterOptions) {
  return function (target: object, propertyKey: string) {
    const existingFilters =
      (Reflect.getMetadata(QUERY_FILTER_METADATA_KEY, target) as Record<
        string,
        QueryFilterOptions
      >) || {};
    existingFilters[propertyKey] = options || {
      operator: FilterOperator.EQUALS,
    };
    Reflect.defineMetadata(QUERY_FILTER_METADATA_KEY, existingFilters, target);
  };
}
