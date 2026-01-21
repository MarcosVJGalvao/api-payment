import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { AppLoggerService } from '@/common/logger/logger.service';
import { SwaggerValue } from './interfaces/swagger.interface';

@Injectable()
export class SwaggerService {
  private document: OpenAPIObject;

  constructor(private readonly logger: AppLoggerService) {}

  generateDocument(app: INestApplication): void {
    try {
      const config = new DocumentBuilder()
        .setTitle('School System API')
        .setDescription('API Documentation for School System')
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
      this.document = this.normalizeSwagger(
        rawDocument as unknown as SwaggerValue,
      ) as unknown as OpenAPIObject;
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

    const filteredDocument = JSON.parse(
      JSON.stringify(this.document),
    ) as OpenAPIObject;

    const filteredPaths: OpenAPIObject['paths'] = {};

    for (const [path, pathItem] of Object.entries(this.document.paths || {})) {
      const filteredPathItem: typeof pathItem = {};
      let hasMatchingMethod = false;

      for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
        const operation = pathItem?.[method];
        if (operation?.security) {
          const hasAuthKey = operation.security.some(
            (sec: Record<string, unknown>) => authKey in sec,
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

      const record = obj as Record<string, unknown>;
      if (record.$ref && typeof record.$ref === 'string') {
        const match = record.$ref.match(/#\/components\/schemas\/(.+)/);
        if (match) {
          schemasToProcess.add(match[1]);
        }
      }

      Object.values(record).forEach(collectRefs);
    };

    collectRefs(paths);

    if (allSchemas) {
      while (schemasToProcess.size > 0) {
        const schemaName = schemasToProcess.values().next().value as string;
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
    const finalUsedSchemas = this.collectUsedSchemas(
      {} as OpenAPIObject['paths'],
      allSchemas,
    );

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
      ? this.filterSecuritySchemes(
          components.securitySchemes as Record<string, unknown>,
          authKey,
        )
      : components.securitySchemes;

    return {
      ...components,
      schemas: filteredSchemas,
      securitySchemes:
        filteredSecuritySchemes as typeof components.securitySchemes,
    };
  }

  /**
   * Filtra os securitySchemes para manter apenas o authKey especificado
   */
  private filterSecuritySchemes(
    securitySchemes: Record<string, unknown> | undefined,
    authKey: string,
  ): Record<string, unknown> | undefined {
    if (!securitySchemes) return securitySchemes;

    const filtered: Record<string, unknown> = {};
    if (securitySchemes[authKey]) {
      filtered[authKey] = securitySchemes[authKey];
    }

    return filtered;
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

      const record = o as Record<string, unknown>;
      if (record.$ref && typeof record.$ref === 'string') {
        const match = record.$ref.match(/#\/components\/schemas\/(.+)/);
        if (match) refs.add(match[1]);
      }

      Object.values(record).forEach(extract);
    };

    extract(obj);
    return refs;
  }

  private normalizeSwagger(
    obj: SwaggerValue,
    parentKey?: string,
    method?: string,
  ): SwaggerValue {
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.normalizeSwagger(item as SwaggerValue, parentKey, method),
      ) as SwaggerValue;
    }

    if (obj && typeof obj === 'object' && obj !== null) {
      const swaggerObj = obj;
      const keys = Object.keys(swaggerObj);

      // Objetos numerados → array
      if (keys.length && keys.every((k, i) => String(i) === k)) {
        return keys.map((k) =>
          this.normalizeSwagger(
            swaggerObj[k] as SwaggerValue,
            parentKey,
            method,
          ),
        ) as SwaggerValue;
      }

      // Enums → array
      if (swaggerObj.enum && !Array.isArray(swaggerObj.enum)) {
        swaggerObj.enum = Object.values(swaggerObj.enum);
      }

      // Required → array apenas para schemas de objeto
      if (
        swaggerObj.required &&
        !Array.isArray(swaggerObj.required) &&
        swaggerObj.type === 'object'
      ) {
        swaggerObj.required = Object.values(swaggerObj.required) as string[];
      }

      // Security → array sem duplicados
      if (swaggerObj.security) {
        if (!Array.isArray(swaggerObj.security)) {
          // Se não for array, tenta corrigir ou deixa como está se for objeto válido
          // Mas o type definition diz que é array de objetos geralmente.
          // Vamos manter a lógica original de fallback se não for array, mas cuidado
          swaggerObj.security = [];
        } else {
          const securityArray = swaggerObj.security;
          // Apenas remover duplicados, sem sobrescrever chaves
          const normalized = securityArray.filter(
            (v, i, a) =>
              i ===
              a.findIndex((obj) => JSON.stringify(obj) === JSON.stringify(v)),
          );
          swaggerObj.security = normalized;
        }
      }

      // Remover requestBody de GET e DELETE
      if (parentKey === 'paths' && method && swaggerObj.requestBody) {
        const methodUpper = method.toUpperCase();
        if (['GET', 'DELETE'].includes(methodUpper)) {
          delete swaggerObj.requestBody;
        }
      }

      // Corrigir responses: colocar schema dentro de content
      if (keys.includes('responses')) {
        const responses = swaggerObj.responses;
        if (responses) {
          for (const status of Object.keys(responses)) {
            const response = responses[status];
            if (response && response.schema && !response.content) {
              response.content = {
                'application/json': {
                  schema: response.schema,
                },
              };
              delete response.schema;
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
          swaggerObj[key] as SwaggerValue,
          nextParentKey,
          nextMethod,
        );
      }
    }

    return obj;
  }
}
