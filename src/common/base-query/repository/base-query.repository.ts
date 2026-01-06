import { Repository, ObjectLiteral } from 'typeorm';
import {
  QueryOptions,
  FilterCondition,
} from '../interfaces/query-options.interface';
import {
  PaginationResult,
  PaginationMeta,
} from '../interfaces/pagination-result.interface';
import { getEntityAlias, getRelationAlias } from '../helpers/alias.helpers';
import { applyJoins } from '../helpers/join.helpers';
import { applyJoinsWithSelect } from '../helpers/join-with-select.helpers';
import { applySearch } from '../helpers/search.helpers';
import { applyFilter } from '../helpers/filter.helpers';

export async function executeQuery<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: QueryOptions = {},
): Promise<PaginationResult<T>> {
  const {
    page = 1,
    limit = 10,
    search,
    searchFields,
    sortBy,
    sortOrder = 'ASC',
    filters = [],
    relations = [],
    select,
    withDeleted = false,
  } = options;

  const alias = getEntityAlias(repository);
  const queryBuilder = repository.createQueryBuilder(alias);

  if (withDeleted) {
    queryBuilder.withDeleted();
  }

  const hasRelationFields =
    select?.some((field: string) => field.includes('.')) ?? false;

  if (hasRelationFields && relations.length > 0) {
    applyJoinsWithSelect(queryBuilder, alias, relations, select || [], sortBy);
  } else {
    if (select && select.length > 0) {
      const mainEntityFields = select.filter(
        (field: string) => !field.includes('.') && !relations.includes(field),
      );

      if (mainEntityFields.length > 0) {
        queryBuilder.select(
          mainEntityFields.map((field: string) => `${alias}.${field}`),
        );
      }
    }

    applyJoins(queryBuilder, alias, relations, repository);
  }

  if (search && searchFields && searchFields.length > 0) {
    applySearch(queryBuilder, alias, search, searchFields);
  }

  filters.forEach((filter: FilterCondition, index: number) => {
    applyFilter(queryBuilder, alias, filter, index);
  });

  if (sortBy) {
    if (sortBy.includes('.')) {
      const sortParts = sortBy.split('.');
      const fieldName = sortParts.pop()!;
      const relationPath = sortParts.join('.');
      const relationAlias = getRelationAlias(relationPath);
      queryBuilder.orderBy(`${relationAlias}.${fieldName}`, sortOrder);
    } else {
      queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);
    }
  } else {
    queryBuilder.orderBy(`${alias}.createdAt`, 'DESC');
  }

  const skip = (page - 1) * limit;
  queryBuilder.skip(skip).take(limit);

  const [data, total] = await queryBuilder.getManyAndCount();

  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return { data, meta };
}
