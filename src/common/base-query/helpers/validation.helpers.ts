import { Repository, ObjectLiteral } from 'typeorm';
import { CustomHttpException } from '../../errors/exceptions/custom-http.exception';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../errors/enums/error-code.enum';

/**
 * Valida se todas as relações necessárias para os campos do select estão carregadas
 * @param select - Array de campos selecionados
 * @param relations - Array de relações carregadas
 * @throws CustomHttpException se alguma relação necessária estiver faltando
 * @example
 * validateSelectRelations(['employee.person.name'], ['employee', 'employee.person']);
 */
export function validateSelectRelations(
  select: string[],
  relations: string[],
): void {
  if (!select || select.length === 0) {
    return;
  }

  const relationSelectFields = select.filter((field) => field.includes('.'));
  const missingRelations: string[] = [];

  relationSelectFields.forEach((field) => {
    const fieldParts = field.split('.');
    const requiredRelation = fieldParts.slice(0, -1).join('.');

    let matchedRelation = false;

    for (const relation of relations) {
      if (relation === requiredRelation) {
        matchedRelation = true;
        break;
      }
      if (relation.startsWith(requiredRelation + '.')) {
        matchedRelation = true;
        break;
      }
    }

    if (!matchedRelation) {
      missingRelations.push(requiredRelation);
    }
  });

  if (missingRelations.length > 0) {
    throw new CustomHttpException(
      'Invalid query configuration. Some required relations are missing.',
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_RELATION,
    );
  }
}

/**
 * Valida se os campos de busca referenciam relações que estão carregadas
 * @param repository - Repositório da entidade
 * @param searchFields - Campos de busca
 * @param relations - Relações carregadas
 * @throws CustomHttpException se algum campo de busca referenciar relação não carregada
 * @example
 * validateSearchFields(repository, ['person.name'], ['person']);
 */
export function validateSearchFields<T extends ObjectLiteral>(
  repository: Repository<T>,
  searchFields: string[],
  relations: string[],
): void {
  if (!searchFields || searchFields.length === 0) {
    return;
  }

  const entityMetadata = repository.metadata;
  const entityColumns = entityMetadata.columns.map((col) => col.propertyName);

  const invalidFields: string[] = [];

  searchFields.forEach((field) => {
    if (field.includes('.')) {
      // Campo de relação - verificar se a relação está carregada
      const fieldParts = field.split('.');
      const relationPath = fieldParts.slice(0, -1).join('.');

      let relationFound = false;
      for (const relation of relations) {
        if (
          relation === relationPath ||
          relation.startsWith(relationPath + '.')
        ) {
          relationFound = true;
          break;
        }
      }

      if (!relationFound) {
        invalidFields.push(
          `'${field}' (relation '${relationPath}' is not loaded)`,
        );
      }
    } else {
      // Campo da entidade principal - verificar se existe
      if (!entityColumns.includes(field)) {
        invalidFields.push(`'${field}' (does not exist in entity)`);
      }
    }
  });

  if (invalidFields.length > 0) {
    throw new CustomHttpException(
      `Invalid search fields: ${invalidFields.join(', ')}. Available relations: ${relations.join(', ') || 'none'}`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_QUERY_RELATION,
    );
  }
}

/**
 * Valida se o campo de ordenação existe na entidade ou nas relações
 * @param repository - Repositório da entidade
 * @param sortBy - Campo para ordenação
 * @param relations - Relações carregadas
 * @throws CustomHttpException se o campo não existir
 * @example
 * validateSortField(repository, 'person.name', ['person']);
 */
export function validateSortField<T extends ObjectLiteral>(
  repository: Repository<T>,
  sortBy: string,
  relations: string[],
): void {
  const entityMetadata = repository.metadata;
  const entityColumns = entityMetadata.columns.map((col) => col.propertyName);
  const entityRelations = entityMetadata.relations.map(
    (rel) => rel.propertyName,
  );

  if (sortBy.includes('.')) {
    const sortParts = sortBy.split('.');
    const relationPath = sortParts.slice(0, -1).join('.');

    // Verificar se a relação existe e está carregada
    let relationFound = false;
    for (const relation of relations) {
      if (
        relation === relationPath ||
        relation.startsWith(relationPath + '.')
      ) {
        relationFound = true;
        break;
      }
    }

    if (!relationFound) {
      throw new CustomHttpException(
        `Invalid sort field: relation '${relationPath}' is not loaded. Available relations: ${relations.join(', ') || 'none'}`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_QUERY_RELATION,
      );
    }
  } else {
    // Verificar se o campo existe na entidade
    if (!entityColumns.includes(sortBy) && !entityRelations.includes(sortBy)) {
      throw new CustomHttpException(
        `Invalid sort field: '${sortBy}' does not exist in entity '${entityMetadata.name}'`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_QUERY_RELATION,
      );
    }
  }
}

/**
 * Valida se o campo de data existe na entidade
 * @param repository - Repositório da entidade
 * @param dateField - Campo de data para filtro
 * @throws CustomHttpException se o campo não existir
 * @example
 * validateDateField(repository, 'createdAt');
 */
export function validateDateField<T extends ObjectLiteral>(
  repository: Repository<T>,
  dateField: string,
): void {
  const entityMetadata = repository.metadata;
  const entityColumns = entityMetadata.columns.map((col) => col.propertyName);

  if (!entityColumns.includes(dateField)) {
    throw new CustomHttpException(
      `Invalid date field: '${dateField}' does not exist in entity '${entityMetadata.name}'`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_QUERY_RELATION,
    );
  }
}

/**
 * Valida todas as opções de query antes de executar
 * @param repository - Repositório da entidade
 * @param options - Opções de query a serem validadas
 * @throws CustomHttpException se alguma validação falhar
 */
export function validateQueryOptions<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: {
    sortBy?: string;
    searchFields?: string[];
    dateField?: string;
    relations: string[];
  },
): void {
  if (options.sortBy) {
    validateSortField(repository, options.sortBy, options.relations);
  }

  if (options.searchFields && options.searchFields.length > 0) {
    validateSearchFields(repository, options.searchFields, options.relations);
  }

  if (options.dateField) {
    validateDateField(repository, options.dateField);
  }
}
