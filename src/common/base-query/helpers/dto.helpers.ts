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

  // Processa cada campo do DTO
  Object.keys(dto).forEach((key) => {
    const value = (dto as Record<string, any>)[key];

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

    filters.push({
      field: actualField,
      operator,
      value: value,
      relation: relation || undefined,
    });
  });

  // Adiciona filtros manuais se existirem no DTO
  if ('filters' in dto && dto.filters && Array.isArray(dto.filters)) {
    filters.push(...(dto.filters as FilterCondition[]));
  }

  return filters;
}
