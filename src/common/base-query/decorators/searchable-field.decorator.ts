import 'reflect-metadata';
import { SearchableFieldConfig } from '../interfaces/search.interface';
import { isRecord } from '@/common/errors/helpers/type.helpers';

export const SEARCHABLE_FIELDS_METADATA_KEY = 'query:searchable';

/**
 * Decorator para marcar campos do DTO como pesquisáveis
 * @param relation - Relação onde o campo está localizado (opcional)
 * @returns Decorator function
 */
export function SearchableField(relation?: string) {
  return function (target: object, propertyKey: string) {
    const existingFieldsRaw = Reflect.getMetadata(
      SEARCHABLE_FIELDS_METADATA_KEY,
      target,
    );
    const existingFields: SearchableFieldConfig[] = Array.isArray(
      existingFieldsRaw,
    )
      ? existingFieldsRaw.filter(
          (item): item is SearchableFieldConfig =>
            isRecord(item) && typeof item['field'] === 'string',
        )
      : [];
    existingFields.push({
      field: propertyKey,
      relation,
    });
    Reflect.defineMetadata(
      SEARCHABLE_FIELDS_METADATA_KEY,
      existingFields,
      target,
    );
  };
}
