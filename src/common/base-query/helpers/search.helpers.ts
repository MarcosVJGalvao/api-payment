import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { convertSearchFieldToAlias } from './alias.helpers';

/**
 * Aplica condições de busca por texto nos campos especificados
 * @param queryBuilder - QueryBuilder do TypeORM
 * @param alias - Alias da entidade principal
 * @param search - Texto a ser buscado
 * @param fields - Campos onde buscar
 * @example
 * applySearch(qb, 'user', 'João', ['name', 'email']);
 */
export function applySearch<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  search: string,
  fields: string[],
): void {
  const conditions = fields.map((field, index) => {
    const paramName = `search_${index}`;
    const convertedField = convertSearchFieldToAlias(field, alias);
    return `${convertedField} LIKE :${paramName}`;
  });

  const params: Record<string, string> = {};
  fields.forEach((_field, index) => {
    params[`search_${index}`] = `%${search}%`;
  });

  queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
}
