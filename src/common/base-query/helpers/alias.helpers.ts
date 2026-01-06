import { Repository, ObjectLiteral } from 'typeorm';

/**
 * Obtém o alias da entidade (primeira letra minúscula)
 * @param repository - Repositório da entidade
 * @returns Alias da entidade
 * @example
 * // Para entidade 'Employee', retorna 'employee'
 * const alias = getEntityAlias(employeeRepository); // 'employee'
 */
export function getEntityAlias<T extends ObjectLiteral>(
  repository: Repository<T>,
): string {
  const entityName = repository.metadata.name;
  return entityName.charAt(0).toLowerCase() + entityName.slice(1);
}

/**
 * Converte notação com ponto para o alias usado nos joins
 * @param relation - Relação no formato 'person' ou 'person.addresses'
 * @returns Alias da relação
 * @example
 * getRelationAlias('person.addresses'); // 'person_addresses'
 */
export function getRelationAlias(relation: string): string {
  const parts = relation.split('.');
  if (parts.length === 1) {
    return relation;
  }
  return parts.join('_');
}

/**
 * Converte campo de busca com notação de ponto para o alias correto
 * @param field - Campo no formato 'campo' ou 'relacao.campo'
 * @param entityAlias - Alias da entidade principal
 * @returns Campo convertido para usar o alias correto
 * @example
 * convertSearchFieldToAlias('person.addresses.city', 'employee'); // 'person_addresses.city'
 */
export function convertSearchFieldToAlias(
  field: string,
  entityAlias: string,
): string {
  if (!field.includes('.')) {
    return `${entityAlias}.${field}`;
  }

  const parts = field.split('.');
  const fieldName = parts.pop();
  const relationPath = parts.join('.');

  const relationAlias = getRelationAlias(relationPath);
  return `${relationAlias}.${fieldName}`;
}
