import 'reflect-metadata';
import { FilterOperator } from '../enums/filter-operator.enum';
import { isRecord } from '@/common/errors/helpers/type.helpers';

export const QUERY_FILTER_METADATA_KEY = 'query:filter';

export interface QueryFilterOptions {
  operator?: FilterOperator;
  relation?: string;
  ignore?: boolean;
}

const filterOperatorValues = Object.values(FilterOperator).filter(
  (value): value is FilterOperator => typeof value === 'string',
);

function isFilterOperator(value: unknown): value is FilterOperator {
  return (
    typeof value === 'string' &&
    filterOperatorValues.some((operator) => operator === value)
  );
}

/**
 * Decorator para marcar campos do DTO como filtros
 * @param options - Opções de configuração do filtro
 * @returns Decorator function
 */
export function QueryFilter(options?: QueryFilterOptions) {
  return function (target: object, propertyKey: string) {
    const existingFiltersRaw = Reflect.getMetadata(
      QUERY_FILTER_METADATA_KEY,
      target,
    );
    const existingFilters: Record<string, QueryFilterOptions> = {};
    if (isRecord(existingFiltersRaw)) {
      Object.entries(existingFiltersRaw).forEach(([key, value]) => {
        if (!isRecord(value)) {
          return;
        }
        existingFilters[key] = {
          operator: isFilterOperator(value['operator'])
            ? value['operator']
            : undefined,
          relation:
            typeof value['relation'] === 'string'
              ? value['relation']
              : undefined,
          ignore:
            typeof value['ignore'] === 'boolean' ? value['ignore'] : undefined,
        };
      });
    }
    existingFilters[propertyKey] = options || {
      operator: FilterOperator.EQUALS,
    };
    Reflect.defineMetadata(QUERY_FILTER_METADATA_KEY, existingFilters, target);
  };
}
