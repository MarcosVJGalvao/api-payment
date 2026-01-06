import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import {
  ColumnMetadata,
  EntityMetadataInfo,
  JoinColumn,
  RelationMetadata,
} from '../interfaces/join.interface';

/**
 * Aplica joins nas relações especificadas carregando todos os campos
 * @param queryBuilder - QueryBuilder do TypeORM
 * @param alias - Alias da entidade principal
 * @param relations - Array de relações a serem carregadas
 * @param repository - Repositório da entidade
 * @example
 * applyJoins(qb, 'user', ['employee', 'employee.person'], repository);
 */
export function applyJoins<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  relations: string[],
  repository?: Repository<T>,
): void {
  const createdJoins = new Set<string>();
  const intermediateRelations: Array<{
    alias: string;
    metadata: EntityMetadataInfo | null;
    excludeForeignKey?: string | null;
  }> = [];

  const relationsAsPrefix = new Set<string>();
  relations.forEach((relation) => {
    if (relation.includes('.')) {
      const parts = relation.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        const prefix = parts.slice(0, i + 1).join('.');
        relationsAsPrefix.add(prefix);
      }
    }
  });

  if (relations.length > 0) {
    relations.forEach((relation) => {
      const parts = relation.split('.');

      if (parts.length === 1) {
        const joinKey = `${alias}.${relation}`;
        if (!createdJoins.has(joinKey)) {
          if (relationsAsPrefix.has(relation)) {
            queryBuilder.leftJoin(`${alias}.${relation}`, relation);
            if (repository) {
              const relationMetadata = repository.metadata.relations.find(
                (rel) => rel.propertyName === relation,
              );
              if (relationMetadata) {
                // Encontra a próxima relação para excluir sua foreign key
                const nestedRelation = relations.find((r) =>
                  r.startsWith(`${relation}.`),
                );
                let foreignKeyToExclude: string | null = null;
                if (nestedRelation) {
                  const nextPart = nestedRelation.split('.')[1];
                  const nextRelationMetadata =
                    relationMetadata.inverseEntityMetadata?.relations.find(
                      (rel: any) => rel.propertyName === nextPart,
                    );
                  if (
                    nextRelationMetadata?.joinColumns &&
                    nextRelationMetadata.joinColumns.length > 0
                  ) {
                    foreignKeyToExclude =
                      nextRelationMetadata.joinColumns[0].propertyName;
                  }
                }
                intermediateRelations.push({
                  alias: relation,
                  metadata: relationMetadata.inverseEntityMetadata,
                  excludeForeignKey: foreignKeyToExclude,
                });
              }
            }
          } else {
            queryBuilder.leftJoinAndSelect(`${alias}.${relation}`, relation);
          }
          createdJoins.add(joinKey);
        }
      } else {
        let currentAlias = alias;
        let currentMetadata = repository?.metadata;
        parts.forEach((part, index) => {
          const joinAlias = parts.slice(0, index + 1).join('_');
          const previousAlias =
            index === 0 ? alias : parts.slice(0, index).join('_');
          const joinKey = `${previousAlias}.${part}`;

          if (!createdJoins.has(joinKey)) {
            if (index === parts.length - 1) {
              queryBuilder.leftJoinAndSelect(
                `${currentAlias}.${part}`,
                joinAlias,
              );
            } else {
              queryBuilder.leftJoin(`${currentAlias}.${part}`, joinAlias);

              if (currentMetadata) {
                const relationMetadata = currentMetadata.relations.find(
                  (rel) => rel.propertyName === part,
                );
                if (relationMetadata) {
                  const nextPart = parts[index + 1];
                  let foreignKeyToExclude: string | null = null;
                  if (nextPart) {
                    const nextRelation =
                      relationMetadata.inverseEntityMetadata?.relations.find(
                        (rel: any) => rel.propertyName === nextPart,
                      );
                    if (
                      nextRelation?.joinColumns &&
                      nextRelation.joinColumns.length > 0
                    ) {
                      foreignKeyToExclude =
                        nextRelation.joinColumns[0].propertyName;
                    }
                  }

                  intermediateRelations.push({
                    alias: joinAlias,
                    metadata: relationMetadata.inverseEntityMetadata,
                    excludeForeignKey: foreignKeyToExclude,
                  });
                  currentMetadata = relationMetadata.inverseEntityMetadata;
                }
              }
            }
            createdJoins.add(joinKey);
          } else {
            if (currentMetadata) {
              const relationMetadata = currentMetadata.relations.find(
                (rel) => rel.propertyName === part,
              );
              if (relationMetadata) {
                currentMetadata = relationMetadata.inverseEntityMetadata;
              }
            }
          }
          currentAlias = joinAlias;
        });
      }
    });
  }

  intermediateRelations.forEach(
    ({ alias: relationAlias, metadata, excludeForeignKey }) => {
      if (metadata) {
        const relationPropertyNames = new Set(
          metadata.relations.map((rel: RelationMetadata) => rel.propertyName),
        );

        // Coleta todas as foreign keys para exclusão
        const foreignKeyPropertyNames = new Set<string>();
        metadata.relations.forEach((rel: RelationMetadata) => {
          if (rel.joinColumns && rel.joinColumns.length > 0) {
            rel.joinColumns.forEach((joinCol: JoinColumn) => {
              foreignKeyPropertyNames.add(joinCol.propertyName);
            });
          }
          if (rel.inverseJoinColumns && rel.inverseJoinColumns.length > 0) {
            rel.inverseJoinColumns.forEach((joinCol: JoinColumn) => {
              foreignKeyPropertyNames.add(joinCol.propertyName);
            });
          }
        });

        // Exclui também a foreign key específica que aponta para a próxima relação
        if (excludeForeignKey) {
          foreignKeyPropertyNames.add(excludeForeignKey);
        }

        // Seleciona apenas colunas reais (não virtuais, não relações, não foreign keys)
        const columns = metadata.columns
          .filter(
            (col: ColumnMetadata) =>
              !col.isVirtual &&
              !relationPropertyNames.has(col.propertyName) &&
              !foreignKeyPropertyNames.has(col.propertyName),
          )
          .map((col: ColumnMetadata) => col.propertyName);

        columns.forEach((column: string) => {
          queryBuilder.addSelect(`${relationAlias}.${column}`);
        });
      }
    },
  );
}
