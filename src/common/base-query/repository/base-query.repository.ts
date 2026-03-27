import { Repository, ObjectLiteral } from 'typeorm';
import {
  QueryOptions,
  FilterCondition,
} from '../interfaces/query-options.interface';
import { SortOrder } from '../enums/sort-order.enum';
import {
  PaginationResult,
  PaginationMeta,
} from '../interfaces/pagination-result.interface';
import { getEntityAlias, getRelationAlias } from '../helpers/alias.helpers';
import { applyJoins } from '../helpers/join.helpers';
import { applyJoinsWithSelect } from '../helpers/join-with-select.helpers';
import { applySearch } from '../helpers/search.helpers';
import { applyFilter } from '../helpers/filter.helpers';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export async function executeQuery<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: QueryOptions = {},
): Promise<PaginationResult<T>> {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search,
    searchFields,
    sortBy,
    sortOrder = SortOrder.ASC,
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
    queryBuilder.orderBy(`${alias}.createdAt`, SortOrder.DESC);
  }

  const safePage = page && page > 0 ? page : DEFAULT_PAGE;
  const safeLimit =
    limit && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;

  const skip = (safePage - 1) * safeLimit;
  queryBuilder.skip(skip).take(safeLimit);

  const [data, total] = await queryBuilder.getManyAndCount();

  const totalPages = Math.ceil(total / safeLimit);
  const meta: PaginationMeta = {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };

  return { data, meta };
}
