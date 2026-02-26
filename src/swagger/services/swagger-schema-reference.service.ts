import { Injectable } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { isRecord } from '@/common/errors/helpers/type.helpers';

@Injectable()
export class SwaggerSchemaReferenceService {
  collectUsedSchemas(
    paths: OpenAPIObject['paths'],
    allSchemas?: Record<string, unknown>,
  ): Set<string> {
    const usedSchemas = new Set<string>();
    const schemasToProcess = new Set<string>();

    const collectRefs = (obj: unknown): void => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) return obj.forEach(collectRefs);
      if (!isRecord(obj)) return;

      const refValue = obj['$ref'];
      if (typeof refValue === 'string') {
        const match = refValue.match(/#\/components\/schemas\/(.+)/);
        if (match) schemasToProcess.add(match[1]);
      }

      Object.values(obj).forEach(collectRefs);
    };

    collectRefs(paths);

    if (!allSchemas) {
      schemasToProcess.forEach((s) => usedSchemas.add(s));
      return usedSchemas;
    }

    while (schemasToProcess.size > 0) {
      const schemaCandidate = schemasToProcess.values().next().value;
      if (typeof schemaCandidate !== 'string') {
        schemasToProcess.clear();
        break;
      }
      schemasToProcess.delete(schemaCandidate);
      if (usedSchemas.has(schemaCandidate) || !allSchemas[schemaCandidate]) {
        continue;
      }
      usedSchemas.add(schemaCandidate);
      collectRefs(allSchemas[schemaCandidate]);
    }

    return usedSchemas;
  }

  extractSchemaRefs(obj: unknown): Set<string> {
    const refs = new Set<string>();

    const extract = (o: unknown): void => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(extract);
      if (!isRecord(o)) return;

      const refValue = o['$ref'];
      if (typeof refValue === 'string') {
        const match = refValue.match(/#\/components\/schemas\/(.+)/);
        if (match) refs.add(match[1]);
      }
      Object.values(o).forEach(extract);
    };

    extract(obj);
    return refs;
  }
}

