import { Injectable } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import {
  QueryOptions,
  BuildQueryOptions,
  FilterConfig,
} from '../interfaces/query-options.interface';
import { PaginationResult } from '../interfaces/pagination-result.interface';
import { FilterOperator } from '../enums/filter-operator.enum';
import { BaseQueryDto } from '../dto/base-query.dto';
import {
  getSearchableFieldsFromDto,
  buildFiltersFromDto,
} from '../helpers/dto.helpers';
import {
  validateSelectRelations,
  validateQueryOptions,
} from '../helpers/validation.helpers';
import { executeQuery } from '../repository/base-query.repository';
import { CustomHttpException } from '../../errors/exceptions/custom-http.exception';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../errors/enums/error-code.enum';

export type { BuildQueryOptions } from '../interfaces/query-options.interface';

@Injectable()
export class BaseQueryService {
  buildQueryOptions<T extends ObjectLiteral>(
    repository: Repository<T>,
    dto: BaseQueryDto,
    options: BuildQueryOptions = {},
  ): QueryOptions {
    const relations: string[] = options.relations ?? [];
    const defaultSortBy = options.defaultSortBy ?? 'createdAt';
    const searchFields: string[] = options.searchFields ?? [];
    const dateField = options.dateField ?? 'createdAt';
    const filterConfigs: FilterConfig[] = options.filters ?? [];
    const select: string[] = options.select ?? [];
    const withDeleted = options.withDeleted ?? false;

    validateSelectRelations(select, relations);

    const filters = buildFiltersFromDto(
      dto,
      repository,
      filterConfigs,
      relations,
    );

    if (dto.startDate || dto.endDate) {
      if (dto.startDate && dto.endDate) {
        filters.push({
          field: dateField,
          operator: FilterOperator.BETWEEN,
          value: [dto.startDate, dto.endDate],
        });
      } else if (dto.startDate) {
        filters.push({
          field: dateField,
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          value: dto.startDate,
        });
      } else if (dto.endDate) {
        filters.push({
          field: dateField,
          operator: FilterOperator.LESS_THAN_OR_EQUAL,
          value: dto.endDate,
        });
      }
    }

    let finalSearchFields: string[] = [];
    if (dto.search) {
      if (searchFields.length > 0) {
        finalSearchFields = searchFields;
      } else {
        finalSearchFields = getSearchableFieldsFromDto(dto, repository);
      }
    }

    const finalSortBy = dto.sortBy || defaultSortBy;

    validateQueryOptions(repository, {
      sortBy: finalSortBy,
      searchFields:
        finalSearchFields.length > 0 ? finalSearchFields : undefined,
      dateField,
      relations,
    });

    return {
      page: dto.page,
      limit: dto.limit,
      search: dto.search,
      searchFields:
        finalSearchFields.length > 0 ? finalSearchFields : undefined,
      sortBy: finalSortBy,
      sortOrder: dto.sortOrder,
      filters,
      relations,
      select,
      withDeleted,
    };
  }

  async findAll<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: QueryOptions = {},
  ): Promise<PaginationResult<T>> {
    try {
      return await executeQuery(repository, options);
    } catch (error: unknown) {
      if (error instanceof CustomHttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes('relation') ||
        errorMessage.includes('join') ||
        errorMessage.includes('alias') ||
        errorMessage.includes('column') ||
        errorMessage.includes('field')
      ) {
        throw new CustomHttpException(
          `Invalid query configuration: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_QUERY_RELATION,
        );
      }

      throw error;
    }
  }
}
