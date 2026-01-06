import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { AppLoggerService } from '@/common/logger/logger.service';
import {
  SwaggerValue,
  SwaggerSecurityScheme,
} from './interfaces/swagger.interface';

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
            description: 'Enter JWT token',
          },
          'bearer',
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
          swaggerObj.security = [{ bearer: [] }];
        } else {
          const securityArray = swaggerObj.security;
          const normalized = securityArray
            .map((sec) => {
              if (typeof sec === 'object' && sec !== null) {
                return { bearer: [] } as SwaggerSecurityScheme;
              }
              return {} as SwaggerSecurityScheme;
            })
            .filter(
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
