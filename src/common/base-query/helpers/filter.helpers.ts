import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { FilterCondition } from '../interfaces/query-options.interface';
import { FilterOperator } from '../enums/filter-operator.enum';
import { getRelationAlias } from './alias.helpers';

/**
 * Aplica uma condição de filtro na query
 * @param queryBuilder - QueryBuilder do TypeORM
 * @param alias - Alias da entidade principal
 * @param filter - Condição de filtro a ser aplicada
 * @param index - Índice do filtro
 * @example
 * applyFilter(qb, 'user', { field: 'status', operator: FilterOperator.EQUALS, value: 'ACTIVE' }, 0);
 */
export function applyFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  filter: FilterCondition,
  index: number,
): void {
  const { field, operator, value, relation } = filter;
  const paramName = `filter_${index}`;
  const relationAlias = relation ? getRelationAlias(relation) : null;
  const fieldPath = relationAlias
    ? `${relationAlias}.${field}`
    : `${alias}.${field}`;

  switch (operator) {
    case FilterOperator.EQUALS:
      queryBuilder.andWhere(`${fieldPath} = :${paramName}`, {
        [paramName]: value,
      });
      break;
    case FilterOperator.NOT_EQUALS:
      queryBuilder.andWhere(`${fieldPath} != :${paramName}`, {
        [paramName]: value,
      });
      break;
    case FilterOperator.LIKE:
      queryBuilder.andWhere(`${fieldPath} LIKE :${paramName}`, {
        [paramName]: `%${String(value)}%`,
      });
      break;
    case FilterOperator.ILIKE:
      queryBuilder.andWhere(`LOWER(${fieldPath}) LIKE LOWER(:${paramName})`, {
        [paramName]: `%${String(value)}%`,
      });
      break;
    case FilterOperator.IN:
      queryBuilder.andWhere(`${fieldPath} IN (:...${paramName})`, {
        [paramName]: Array.isArray(value) ? value : [value],
      });
      break;
    case FilterOperator.NOT_IN:
      queryBuilder.andWhere(`${fieldPath} NOT IN (:...${paramName})`, {
        [paramName]: Array.isArray(value) ? value : [value],
      });
      break;
    case FilterOperator.GREATER_THAN:
      queryBuilder.andWhere(`${fieldPath} > :${paramName}`, {
        [paramName]: value,
      });
      break;
    case FilterOperator.GREATER_THAN_OR_EQUAL:
      queryBuilder.andWhere(`${fieldPath} >= :${paramName}`, {
        [paramName]: value,
      });
      break;
    case FilterOperator.LESS_THAN:
      queryBuilder.andWhere(`${fieldPath} < :${paramName}`, {
        [paramName]: value,
      });
      break;
    case FilterOperator.LESS_THAN_OR_EQUAL:
      queryBuilder.andWhere(`${fieldPath} <= :${paramName}`, {
        [paramName]: value,
      });
      break;
    case FilterOperator.BETWEEN:
      if (Array.isArray(value) && value.length === 2) {
        queryBuilder.andWhere(
          `${fieldPath} BETWEEN :${paramName}_start AND :${paramName}_end`,
          {
            [`${paramName}_start`]: value[0],
            [`${paramName}_end`]: value[1],
          },
        );
      }
      break;
    case FilterOperator.IS_NULL:
      queryBuilder.andWhere(`${fieldPath} IS NULL`);
      break;
    case FilterOperator.IS_NOT_NULL:
      queryBuilder.andWhere(`${fieldPath} IS NOT NULL`);
      break;
  }
}
