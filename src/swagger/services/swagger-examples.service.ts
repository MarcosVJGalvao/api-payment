import { Injectable } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { isRecord } from '@/common/errors/helpers/type.helpers';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

@Injectable()
export class SwaggerExamplesService {
  enrichSuccessResponseExamples(document: OpenAPIObject): void {
    for (const pathItem of Object.values(document.paths || {})) {
      if (!isRecord(pathItem)) continue;
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (!isRecord(operation) || !isRecord(operation.responses)) continue;

        for (const [statusCode, response] of Object.entries(operation.responses)) {
          if (!String(statusCode).startsWith('2') || !isRecord(response)) continue;

          const content = response['content'];
          if (isRecord(content) && isRecord(content['application/json'])) {
            const jsonContent = content['application/json'];
            const hasExamples =
              ('example' in jsonContent && jsonContent['example'] !== undefined) ||
              (isRecord(jsonContent['examples']) &&
                Object.keys(jsonContent['examples']).length > 0);
            if (!hasExamples) {
              const generated = this.generateExampleFromSchema(
                jsonContent['schema'],
                document,
              );
              if (generated !== undefined) jsonContent['example'] = generated;
            }
            continue;
          }

          const schema = response['schema'];
          if (!schema) continue;
          if (isRecord(schema) && schema['example'] !== undefined) continue;
          const generated = this.generateExampleFromSchema(schema, document);
          if (generated !== undefined && isRecord(schema)) schema['example'] = generated;
        }
      }
    }
  }

  generateExampleFromSchema(
    schema: unknown,
    document: OpenAPIObject,
    depth = 0,
  ): unknown {
    if (!schema || depth > 6 || !isRecord(schema)) return undefined;

    const refValue = schema['$ref'];
    if (typeof refValue === 'string') {
      const match = refValue.match(/^#\/components\/schemas\/(.+)$/);
      if (!match) return undefined;
      return this.generateExampleFromSchema(
        document.components?.schemas?.[match[1]],
        document,
        depth + 1,
      );
    }

    if (schema['example'] !== undefined) return schema['example'];

    const enumValue = schema['enum'];
    if (Array.isArray(enumValue) && enumValue.length > 0) return enumValue[0];

    for (const key of ['oneOf', 'anyOf'] as const) {
      const variants = schema[key];
      if (Array.isArray(variants) && variants.length > 0) {
        return this.generateExampleFromSchema(variants[0], document, depth + 1);
      }
    }

    const allOf = schema['allOf'];
    if (Array.isArray(allOf) && allOf.length > 0) {
      const merged: Record<string, unknown> = {};
      for (const part of allOf) {
        const value = this.generateExampleFromSchema(part, document, depth + 1);
        if (isRecord(value)) Object.assign(merged, value);
      }
      if (Object.keys(merged).length > 0) return merged;
    }

    if (schema['type'] === 'array' || schema['items']) {
      const item = this.generateExampleFromSchema(schema['items'], document, depth + 1);
      return item === undefined ? [] : [item];
    }

    const properties = schema['properties'];
    if (schema['type'] === 'object' || isRecord(properties)) {
      const obj: Record<string, unknown> = {};
      if (isRecord(properties)) {
        for (const [key, propSchema] of Object.entries(properties)) {
          const value = this.generateExampleFromSchema(propSchema, document, depth + 1);
          obj[key] = value === undefined ? null : value;
        }
      }
      return obj;
    }

    if (schema['type'] === 'string') {
      const format = schema['format'];
      if (format === 'date-time') return '2026-01-01T00:00:00.000Z';
      if (format === 'date') return '2026-01-01';
      if (format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      if (format === 'email') return 'user@example.com';
      if (format === 'uri') return 'https://example.com';
      return 'string';
    }
    if (schema['type'] === 'integer' || schema['type'] === 'number') return 0;
    if (schema['type'] === 'boolean') return true;

    return undefined;
  }
}

