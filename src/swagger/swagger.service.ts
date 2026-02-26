import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { AppLoggerService } from '@/common/logger/logger.service';
import { isRecord } from '@/common/errors/helpers/type.helpers';

type PathItem = NonNullable<OpenAPIObject['paths'][string]>;
type Operation = NonNullable<PathItem[keyof PathItem]>;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function isOperation(value: unknown): value is Operation {
  return isRecord(value);
}

@Injectable()
export class SwaggerService {
  private document: OpenAPIObject;

  constructor(private readonly logger: AppLoggerService) {}

  generateDocument(app: INestApplication): void {
    try {
      const config = new DocumentBuilder()
        .setTitle('Payments API')
        .setDescription(
          'API de pagamentos que integra múltiplos provedores financeiros para processamento de transações PIX, Boletos, TED e Pagamentos de Contas.',
        )
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT para usuários do Backoffice',
          },
          'backoffice-auth',
        )
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT para usuários Internos',
          },
          'internal-auth',
        )
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT para Provedores Financeiros',
          },
          'provider-auth',
        )
        .build();

      const rawDocument = SwaggerModule.createDocument(app, config);
      const normalized = this.normalizeSwagger(rawDocument);
      if (!this.isOpenApiObject(normalized)) {
        throw new Error('Normalized swagger document is invalid');
      }

      this.enrichSuccessResponseExamples(normalized);
      this.document = normalized;
    } catch (error) {
      this.logger.error(
        'Failed to generate Swagger document',
        error instanceof Error ? error.stack : String(error),
        'SwaggerService',
      );
      throw error;
    }
  }

  getSwaggerDocument(): OpenAPIObject {
    if (!this.document) {
      throw new Error(
        'Swagger document not generated. Call generateDocument() first.',
      );
    }
    return this.document;
  }

  /**
   * Retorna um documento Swagger filtrado por tipo de autenticação
   * @param authKey - Chave de autenticação (provider-auth, backoffice-auth, internal-auth)
   * @returns Documento OpenAPI contendo apenas os paths e schemas que usam a autenticação especificada
   */
  getFilteredDocument(authKey: string): OpenAPIObject {
    if (!this.document) {
      throw new Error(
        'Swagger document not generated. Call generateDocument() first.',
      );
    }

    const filteredDocument: OpenAPIObject = {
      ...this.document,
      paths: {},
      components: { ...this.document.components },
    };

    const filteredPaths: OpenAPIObject['paths'] = {};

    for (const [path, pathItem] of Object.entries(this.document.paths || {})) {
      const filteredPathItem: OpenAPIObject['paths'][string] = {};
      let hasMatchingMethod = false;

      const pathItemRecord = isRecord(pathItem) ? pathItem : {};
      for (const method of HTTP_METHODS) {
        const operation = pathItemRecord[method];
        if (!isOperation(operation)) {
          continue;
        }
        const security = operation['security'];
        if (Array.isArray(security)) {
          const hasAuthKey = security.some(
            (sec) => isRecord(sec) && authKey in sec,
          );
          if (hasAuthKey) {
            filteredPathItem[method] = operation;
            hasMatchingMethod = true;
          }
        }
      }

      if (hasMatchingMethod) {
        filteredPaths[path] = filteredPathItem;
      }
    }

    filteredDocument.paths = filteredPaths;

    const usedSchemas = this.collectUsedSchemas(filteredPaths);
    filteredDocument.components = this.filterComponents(
      filteredDocument.components,
      usedSchemas,
      authKey,
    );

    return filteredDocument;
  }

  /**
   * Coleta todos os schemas referenciados nos paths filtrados
   */
  private collectUsedSchemas(
    paths: OpenAPIObject['paths'],
    allSchemas?: Record<string, unknown>,
  ): Set<string> {
    const usedSchemas = new Set<string>();
    const schemasToProcess = new Set<string>();

    const collectRefs = (obj: unknown): void => {
      if (!obj || typeof obj !== 'object') return;

      if (Array.isArray(obj)) {
        obj.forEach(collectRefs);
        return;
      }

      if (!isRecord(obj)) {
        return;
      }

      const refValue = obj['$ref'];
      if (typeof refValue === 'string') {
        const match = refValue.match(/#\/components\/schemas\/(.+)/);
        if (match) {
          schemasToProcess.add(match[1]);
        }
      }

      Object.values(obj).forEach(collectRefs);
    };

    collectRefs(paths);

    if (allSchemas) {
      while (schemasToProcess.size > 0) {
        const schemaCandidate = schemasToProcess.values().next().value;
        if (typeof schemaCandidate !== 'string') {
          schemasToProcess.clear();
          break;
        }
        const schemaName = schemaCandidate;
        schemasToProcess.delete(schemaName);

        if (!usedSchemas.has(schemaName) && allSchemas[schemaName]) {
          usedSchemas.add(schemaName);
          collectRefs(allSchemas[schemaName]);
        }
      }
    } else {
      schemasToProcess.forEach((s) => usedSchemas.add(s));
    }

    return usedSchemas;
  }

  /**
   * Filtra os components para manter apenas os schemas e securitySchemes utilizados
   */
  private filterComponents(
    components: OpenAPIObject['components'],
    usedSchemas: Set<string>,
    authKey?: string,
  ): OpenAPIObject['components'] {
    if (!components) return components;

    const allSchemas = components.schemas || {};
    const emptyPaths: OpenAPIObject['paths'] = {};
    const finalUsedSchemas = this.collectUsedSchemas(emptyPaths, allSchemas);

    usedSchemas.forEach((s) => finalUsedSchemas.add(s));

    const schemaQueue = [...usedSchemas];
    while (schemaQueue.length > 0) {
      const schemaName = schemaQueue.pop()!;
      if (allSchemas[schemaName]) {
        const nestedRefs = this.extractSchemaRefs(allSchemas[schemaName]);
        nestedRefs.forEach((ref) => {
          if (!finalUsedSchemas.has(ref)) {
            finalUsedSchemas.add(ref);
            schemaQueue.push(ref);
          }
        });
      }
    }

    const filteredSchemas: typeof allSchemas = {};
    finalUsedSchemas.forEach((schemaName) => {
      if (allSchemas[schemaName]) {
        filteredSchemas[schemaName] = allSchemas[schemaName];
      }
    });

    const filteredSecuritySchemes = authKey
      ? this.filterSecuritySchemes(components.securitySchemes, authKey)
      : components.securitySchemes;

    return {
      ...components,
      schemas: filteredSchemas,
      securitySchemes: filteredSecuritySchemes ?? components.securitySchemes,
    };
  }

  /**
   * Filtra os securitySchemes para manter apenas o authKey especificado
   */
  private filterSecuritySchemes(
    securitySchemes: NonNullable<
      OpenAPIObject['components']
    >['securitySchemes'],
    authKey: string,
  ): NonNullable<OpenAPIObject['components']>['securitySchemes'] {
    if (!securitySchemes) return securitySchemes;

    const scheme = securitySchemes[authKey];
    if (!scheme) return {};
    return { [authKey]: scheme };
  }

  /**
   * Extrai referências de schemas de um objeto
   */
  private extractSchemaRefs(obj: unknown): Set<string> {
    const refs = new Set<string>();

    const extract = (o: unknown): void => {
      if (!o || typeof o !== 'object') return;

      if (Array.isArray(o)) {
        o.forEach(extract);
        return;
      }

      if (!isRecord(o)) {
        return;
      }

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

  private isOpenApiObject(value: unknown): value is OpenAPIObject {
    if (!isRecord(value)) return false;
    return typeof value.openapi === 'string' && typeof value.info === 'object';
  }

  private normalizeSwagger(
    obj: unknown,
    parentKey?: string,
    method?: string,
  ): unknown {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeSwagger(item, parentKey, method));
    }

    if (isRecord(obj)) {
      const swaggerObj = obj;
      const keys = Object.keys(swaggerObj);

      // Objetos numerados → array
      if (keys.length && keys.every((k, i) => String(i) === k)) {
        return keys.map((k) =>
          this.normalizeSwagger(swaggerObj[k], parentKey, method),
        );
      }

      // Enums → array
      const enumValue = swaggerObj['enum'];
      if (enumValue && !Array.isArray(enumValue) && isRecord(enumValue)) {
        swaggerObj['enum'] = Object.values(enumValue);
      }

      // Required → array apenas para schemas de objeto
      const requiredValue = swaggerObj['required'];
      if (
        requiredValue &&
        !Array.isArray(requiredValue) &&
        swaggerObj['type'] === 'object' &&
        isRecord(requiredValue)
      ) {
        swaggerObj['required'] = Object.values(requiredValue);
      }

      const securityValue = swaggerObj['security'];
      if (securityValue) {
        if (!Array.isArray(securityValue)) {
          swaggerObj['security'] = [];
        } else {
          const securityArray = securityValue;
          // Apenas remover duplicados, sem sobrescrever chaves
          const normalized = securityArray.filter(
            (v, i, a) =>
              i ===
              a.findIndex((obj) => JSON.stringify(obj) === JSON.stringify(v)),
          );
          swaggerObj['security'] = normalized;
        }
      }

      // Remover requestBody de GET e DELETE
      if (parentKey === 'paths' && method && swaggerObj['requestBody']) {
        const methodUpper = method.toUpperCase();
        if (['GET', 'DELETE'].includes(methodUpper)) {
          delete swaggerObj['requestBody'];
        }
      }

      // Corrigir responses: colocar schema dentro de content
      if (keys.includes('responses')) {
        const responses = swaggerObj['responses'];
        if (isRecord(responses)) {
          for (const status of Object.keys(responses)) {
            const response = responses[status];
            if (
              isRecord(response) &&
              response['schema'] &&
              !response['content']
            ) {
              response['content'] = {
                'application/json': {
                  schema: response['schema'],
                },
              };
              delete response['schema'];
            }
          }
        }
      }

      // Recursão
      for (const key of keys) {
        const nextMethod = ['get', 'post', 'patch', 'delete', 'put'].includes(
          key,
        )
          ? key
          : method;
        const nextParentKey = key === 'paths' ? key : parentKey;
        swaggerObj[key] = this.normalizeSwagger(
          swaggerObj[key],
          nextParentKey,
          nextMethod,
        );
      }
    }

    return obj;
  }

  private enrichSuccessResponseExamples(document: OpenAPIObject): void {
    for (const pathItem of Object.values(document.paths || {})) {
      if (!isRecord(pathItem)) continue;

      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (!isRecord(operation) || !isRecord(operation.responses)) continue;

        for (const [statusCode, response] of Object.entries(operation.responses)) {
          if (!String(statusCode).startsWith('2')) continue;
          if (!isRecord(response)) continue;

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
              if (generated !== undefined) {
                jsonContent['example'] = generated;
              }
            }
            continue;
          }

          const schema = response['schema'];
          if (!schema) continue;
          if (isRecord(schema) && schema['example'] !== undefined) continue;

          const generated = this.generateExampleFromSchema(schema, document);
          if (generated !== undefined && isRecord(schema)) {
            schema['example'] = generated;
          }
        }
      }
    }
  }

  private generateExampleFromSchema(
    schema: unknown,
    document: OpenAPIObject,
    depth = 0,
  ): unknown {
    if (!schema || depth > 6) return undefined;
    if (!isRecord(schema)) return undefined;

    const refValue = schema['$ref'];
    if (typeof refValue === 'string') {
      const match = refValue.match(/^#\/components\/schemas\/(.+)$/);
      if (!match) return undefined;
      const resolved = document.components?.schemas?.[match[1]];
      return this.generateExampleFromSchema(resolved, document, depth + 1);
    }

    if (schema['example'] !== undefined) return schema['example'];

    const enumValue = schema['enum'];
    if (Array.isArray(enumValue) && enumValue.length > 0) {
      return enumValue[0];
    }

    const oneOf = schema['oneOf'];
    if (Array.isArray(oneOf) && oneOf.length > 0) {
      return this.generateExampleFromSchema(oneOf[0], document, depth + 1);
    }
    const anyOf = schema['anyOf'];
    if (Array.isArray(anyOf) && anyOf.length > 0) {
      return this.generateExampleFromSchema(anyOf[0], document, depth + 1);
    }
    const allOf = schema['allOf'];
    if (Array.isArray(allOf) && allOf.length > 0) {
      const merged: Record<string, unknown> = {};
      for (const part of allOf) {
        const value = this.generateExampleFromSchema(part, document, depth + 1);
        if (isRecord(value)) {
          Object.assign(merged, value);
        }
      }
      if (Object.keys(merged).length > 0) return merged;
    }

    const schemaType = schema['type'];
    if (schemaType === 'array' || schema['items']) {
      const item = this.generateExampleFromSchema(
        schema['items'],
        document,
        depth + 1,
      );
      return item === undefined ? [] : [item];
    }

    const properties = schema['properties'];
    if (schemaType === 'object' || isRecord(properties)) {
      const obj: Record<string, unknown> = {};
      if (isRecord(properties)) {
        for (const [key, propSchema] of Object.entries(properties)) {
          const value = this.generateExampleFromSchema(
            propSchema,
            document,
            depth + 1,
          );
          obj[key] = value === undefined ? null : value;
        }
      }
      return obj;
    }

    if (schemaType === 'string') {
      const format = schema['format'];
      if (format === 'date-time') return '2026-01-01T00:00:00.000Z';
      if (format === 'date') return '2026-01-01';
      if (format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      if (format === 'email') return 'user@example.com';
      if (format === 'uri') return 'https://example.com';
      return 'string';
    }
    if (schemaType === 'integer' || schemaType === 'number') return 0;
    if (schemaType === 'boolean') return true;

    return undefined;
  }
}
