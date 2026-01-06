import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { getRelationAlias } from './alias.helpers';

/**
 * Aplica joins com seleção específica de campos para otimização de queries
 * @param queryBuilder - QueryBuilder do TypeORM
 * @param alias - Alias da entidade principal
 * @param relations - Array de relações a serem carregadas
 * @param select - Array de campos a serem selecionados
 * @param sortBy - Campo usado para ordenação
 * @example
 * applyJoinsWithSelect(qb, 'user', ['employee', 'employee.person'], ['id', 'username', 'employee.person.name']);
 */
export function applyJoinsWithSelect<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  relations: string[],
  select: string[],
  sortBy?: string,
): void {
  const createdJoins = new Set<string>();
  const relationFields = new Map<string, string[]>();

  let mainEntityFields = select.filter(
    (field) => !field.includes('.') && !relations.includes(field),
  );
  const relationSelectFields = select.filter((field) => field.includes('.'));

  if (sortBy && !mainEntityFields.includes(sortBy) && !sortBy.includes('.')) {
    mainEntityFields = [...mainEntityFields, sortBy];
  }

  if (mainEntityFields.length === 0) {
    mainEntityFields = ['id'];
  } else if (!mainEntityFields.includes('id')) {
    mainEntityFields = ['id', ...mainEntityFields];
  }
  relationSelectFields.forEach((field) => {
    const fieldParts = field.split('.');
    const fieldName = fieldParts.pop()!;

    let matchedRelation: string | null = null;

    for (let i = fieldParts.length; i > 0; i--) {
      const possibleRelation = fieldParts.slice(0, i).join('.');
      if (relations.includes(possibleRelation)) {
        matchedRelation = possibleRelation;
        break;
      }
    }

    if (matchedRelation) {
      const relationAlias = getRelationAlias(matchedRelation);
      if (!relationFields.has(relationAlias)) {
        relationFields.set(relationAlias, []);
      }
      relationFields.get(relationAlias)!.push(fieldName);
    }
  });

  queryBuilder.select(mainEntityFields.map((field) => `${alias}.${field}`));

  const sortedRelations = [...relations].sort((a, b) => {
    const depthA = a.split('.').length;
    const depthB = b.split('.').length;
    return depthA - depthB;
  });

  if (sortedRelations.length > 0) {
    sortedRelations.forEach((relation) => {
      const parts = relation.split('.');
      const relationAlias = getRelationAlias(relation);
      const hasSpecificFields = relationFields.has(relationAlias);

      if (parts.length === 1) {
        const joinKey = `${alias}.${relation}`;
        if (!createdJoins.has(joinKey)) {
          if (hasSpecificFields) {
            queryBuilder.leftJoin(`${alias}.${relation}`, relationAlias);
          } else {
            queryBuilder.leftJoinAndSelect(
              `${alias}.${relation}`,
              relationAlias,
            );
          }
          createdJoins.add(joinKey);
        }
      } else {
        let currentAlias = alias;
        parts.forEach((part, index) => {
          const joinAlias = parts.slice(0, index + 1).join('_');
          const previousPart =
            index === 0 ? alias : parts.slice(0, index).join('_');
          const joinKey = `${previousPart}.${part}`;

          // Atualiza currentAlias se join anterior já existe
          if (index > 0) {
            const previousJoinAlias = parts.slice(0, index).join('_');
            const previousJoinKey =
              index === 1
                ? `${alias}.${parts[0]}`
                : `${parts.slice(0, index - 1).join('_')}.${parts[index - 1]}`;
            if (createdJoins.has(previousJoinKey)) {
              currentAlias = previousJoinAlias;
            }
          }

          if (!createdJoins.has(joinKey)) {
            const isLastPart = index === parts.length - 1;

            if (isLastPart) {
              // Última parte da relação aninhada
              if (hasSpecificFields) {
                queryBuilder.leftJoin(`${currentAlias}.${part}`, joinAlias);
              } else {
                queryBuilder.leftJoinAndSelect(
                  `${currentAlias}.${part}`,
                  joinAlias,
                );
              }
            } else {
              // Parte intermediária: sempre LEFT JOIN sem SELECT
              queryBuilder.leftJoin(`${currentAlias}.${part}`, joinAlias);
            }
            createdJoins.add(joinKey);
          }

          currentAlias = joinAlias;
        });
      }

      if (hasSpecificFields) {
        const fields = relationFields.get(relationAlias)!;
        fields.forEach((field) => {
          queryBuilder.addSelect(`${relationAlias}.${field}`);
        });
      }
    });
  }
}
