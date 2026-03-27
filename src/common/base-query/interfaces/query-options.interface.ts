import { FilterOperator } from '../enums/filter-operator.enum';
import { SortOrder } from '../enums/sort-order.enum';
import { FilterValue } from '../types/filter-value.type';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
  relation?: string;
}

export interface FilterConfig {
  field: string;
  operator?: FilterOperator;
  relation?: string;
  ignore?: boolean;
  mapField?: string;
}

export interface BuildQueryOptions {
  relations?: string[];
  defaultSortBy?: string;
  /** @default 'DESC' */
  defaultSortOrder?: SortOrder;
  /** @default 100 */
  maxLimit?: number;
  searchFields?: string[];
  sortableFields?: string[];
  dateField?: string;
  filters?: FilterConfig[];
  select?: string[];
  withDeleted?: boolean;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: FilterCondition[];
  relations?: string[];
  select?: string[];
  withDeleted?: boolean;
}
