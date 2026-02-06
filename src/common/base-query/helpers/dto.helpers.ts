import { Repository, ObjectLiteral } from 'typeorm';
import {
  FilterCondition,
  FilterConfig,
} from '../interfaces/query-options.interface';
import { FilterOperator } from '../enums/filter-operator.enum';
import { BaseQueryDto } from '../dto/base-query.dto';
import { QUERY_FILTER_METADATA_KEY } from '../decorators/query-filter.decorator';
import { SEARCHABLE_FIELDS_METADATA_KEY } from '../decorators/searchable-field.decorator';
import { getEntityAlias } from './alias.helpers';
import { isRecord } from '@/common/errors/helpers/type.helpers';

const filterOperatorValues = Object.values(FilterOperator).filter(
  (value): value is FilterOperator => typeof value === 'string',
);

function isFilterOperator(value: string): value is FilterOperator {
  return filterOperatorValues.some((operator) => operator === value);
}

function isPrimitiveFilterValue(value: unknown): boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date ||
    value === null
  );
}

function isFilterValue(value: unknown): value is FilterCondition['value'] {
  if (isPrimitiveFilterValue(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    if (value.length === 2) {
      return true;
    }
    return value.every((item) => isPrimitiveFilterValue(item));
  }
  return false;
}

/**
 * Extrai campos pesquisáveis do DTO usando metadata do decorator @SearchableField
 *
 * @param dto - DTO de query
 * @param repository - Repositório da entidade
 * @returns Array de campos pesquisáveis no formato 'alias.campo' ou 'relacao.campo'
 *
 * @example
 * // Se o DTO tem @SearchableField('name') e @SearchableField('email', 'person')
 * getSearchableFieldsFromDto(dto, repository)
 * // Retorna: ['employee.name', 'person.email']
 */
export function getSearchableFieldsFromDto<T extends ObjectLiteral>(
  dto: BaseQueryDto,
  repository: Repository<T>,
): string[] {
  const searchableFields =
    Reflect.getMetadata(SEARCHABLE_FIELDS_METADATA_KEY, dto.constructor) || [];
  const alias = getEntityAlias(repository);

  return searchableFields.map((field: { field: string; relation?: string }) => {
    if (field.relation) {
      return `${field.relation}.${field.field}`;
    }
    return `${alias}.${field.field}`;
  });
}

/**
 * Constrói condições de filtro a partir do DTO e configurações
 * @param dto - DTO de query
 * @param repository - Repositório da entidade
 * @param filterConfigs - Configurações de filtro
 * @param relations - Relações carregadas
 * @returns Array de condições de filtro
 * @example
 * buildFiltersFromDto(dto, repository, [{ field: 'status', operator: FilterOperator.EQUALS }], []);
 */
export function buildFiltersFromDto<T extends ObjectLiteral>(
  dto: BaseQueryDto,
  repository: Repository<T>,
  filterConfigs: FilterConfig[] = [],
  relations: string[] = [],
): FilterCondition[] {
  const filters: FilterCondition[] = [];
  const filterMetadata =
    Reflect.getMetadata(QUERY_FILTER_METADATA_KEY, dto.constructor) || {};

  const excludeFields = [
    'page',
    'limit',
    'search',
    'sortBy',
    'sortOrder',
    'filters',
    'startDate',
    'endDate',
  ];

  const filterConfigMap = new Map<string, FilterConfig>();
  filterConfigs.forEach((config) => {
    filterConfigMap.set(config.field, config);
  });

  const entityMetadata = repository.metadata;
  const entityColumns: string[] = entityMetadata.columns.map(
    (col) => col.propertyName,
  );
  const entityRelations: string[] = entityMetadata.relations.map(
    (rel) => rel.propertyName,
  );

  const dtoRecord = isRecord(dto) ? dto : {};

  // Processa cada campo do DTO
  Object.keys(dtoRecord).forEach((key) => {
    const value = dtoRecord[key];

    // Ignora campos vazios ou da base
    if (excludeFields.includes(key) || value === undefined || value === null) {
      return;
    }

    const dtoFilterConfig = filterMetadata[key];

    // Ignora se marcado como ignore
    if (dtoFilterConfig?.ignore || filterConfigMap.get(key)?.ignore) {
      return;
    }

    const buildConfig = filterConfigMap.get(key);

    // Determina operador (buildQueryOptions > @QueryFilter > EQUALS)
    const operator =
      buildConfig?.operator ??
      dtoFilterConfig?.operator ??
      FilterOperator.EQUALS;

    // Determina relação (buildQueryOptions > @QueryFilter > inferência)
    let relation = buildConfig?.relation;
    if (!relation) {
      relation = dtoFilterConfig?.relation;
    }

    // Determina nome real do campo (mapField permite mapear nome do DTO para nome da coluna)
    const actualField: string = buildConfig?.mapField ?? key;

    // Inferência automática: se campo não existe na entidade e há apenas uma relação, usa essa relação
    if (!relation) {
      if (
        !entityColumns.includes(actualField) &&
        !entityRelations.includes(actualField)
      ) {
        const relationNames = [
          ...new Set(relations.map((rel) => rel.split('.')[0])),
        ];
        if (relationNames.length === 1) {
          relation = relationNames[0];
        }
      }
    }

    if (!isFilterValue(value)) {
      return;
    }

    filters.push({
      field: actualField,
      operator,
      value: value,
      relation: relation || undefined,
    });
  });

  // Adiciona filtros manuais se existirem no DTO
  const rawFilters = dtoRecord['filters'];
  if (Array.isArray(rawFilters)) {
    rawFilters.forEach((item) => {
      if (!isRecord(item)) {
        return;
      }
      const field = item['field'];
      const operator = item['operator'];
      const value = item['value'];
      if (typeof field !== 'string' || typeof operator !== 'string') {
        return;
      }
      if (!isFilterValue(value)) {
        return;
      }

      const relationValue = item['relation'];
      filters.push({
        field,
        operator: isFilterOperator(operator) ? operator : FilterOperator.EQUALS,
        value,
        relation: typeof relationValue === 'string' ? relationValue : undefined,
      });
    });
  }

  return filters;
}
