import { Injectable } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import { SwaggerSchemaReferenceService } from './swagger-schema-reference.service';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

@Injectable()
export class SwaggerDocumentFilterService {
  constructor(private readonly refs: SwaggerSchemaReferenceService) {}

  getFilteredDocument(document: OpenAPIObject, authKey: string): OpenAPIObject {
    const filteredDocument: OpenAPIObject = {
      ...document,
      paths: {},
      components: { ...document.components },
    };

    const filteredPaths: OpenAPIObject['paths'] = {};

    for (const [path, pathItem] of Object.entries(document.paths || {})) {
      const filteredPathItem: OpenAPIObject['paths'][string] = {};
      let hasMatchingMethod = false;
      const pathItemRecord = isRecord(pathItem) ? pathItem : {};

      for (const method of HTTP_METHODS) {
        const operation = pathItemRecord[method];
        if (!isRecord(operation)) continue;
        const security = operation['security'];
        if (!Array.isArray(security)) continue;
        const hasAuthKey = security.some((sec) => isRecord(sec) && authKey in sec);
        if (!hasAuthKey) continue;
        filteredPathItem[method] = operation as never;
        hasMatchingMethod = true;
      }

      if (hasMatchingMethod) filteredPaths[path] = filteredPathItem;
    }

    filteredDocument.paths = filteredPaths;
    const usedSchemas = this.refs.collectUsedSchemas(filteredPaths);
    filteredDocument.components = this.filterComponents(
      filteredDocument.components,
      usedSchemas,
      authKey,
    );

    return filteredDocument;
  }

  private filterComponents(
    components: OpenAPIObject['components'],
    usedSchemas: Set<string>,
    authKey?: string,
  ): OpenAPIObject['components'] {
    if (!components) return components;

    const allSchemas = components.schemas || {};
    const finalUsedSchemas = this.refs.collectUsedSchemas({}, allSchemas);
    usedSchemas.forEach((s) => finalUsedSchemas.add(s));

    const queue = [...usedSchemas];
    while (queue.length > 0) {
      const schemaName = queue.pop()!;
      const schema = allSchemas[schemaName];
      if (!schema) continue;
      for (const ref of this.refs.extractSchemaRefs(schema)) {
        if (finalUsedSchemas.has(ref)) continue;
        finalUsedSchemas.add(ref);
        queue.push(ref);
      }
    }

    const filteredSchemas: typeof allSchemas = {};
    for (const schemaName of finalUsedSchemas) {
      if (allSchemas[schemaName]) filteredSchemas[schemaName] = allSchemas[schemaName];
    }

    const filteredSecuritySchemes = authKey
      ? this.filterSecuritySchemes(components.securitySchemes, authKey)
      : components.securitySchemes;

    return {
      ...components,
      schemas: filteredSchemas,
      securitySchemes: filteredSecuritySchemes ?? components.securitySchemes,
    };
  }

  private filterSecuritySchemes(
    securitySchemes: NonNullable<OpenAPIObject['components']>['securitySchemes'],
    authKey: string,
  ): NonNullable<OpenAPIObject['components']>['securitySchemes'] {
    if (!securitySchemes) return securitySchemes;
    const scheme = securitySchemes[authKey];
    return scheme ? { [authKey]: scheme } : {};
  }
}
