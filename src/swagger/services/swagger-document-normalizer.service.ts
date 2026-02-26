import { Injectable } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { isRecord } from '@/common/errors/helpers/type.helpers';

@Injectable()
export class SwaggerDocumentNormalizerService {
  normalizeSwagger(obj: unknown, parentKey?: string, method?: string): unknown {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeSwagger(item, parentKey, method));
    }

    if (!isRecord(obj)) return obj;

    const swaggerObj = obj;
    const keys = Object.keys(swaggerObj);

    if (keys.length && keys.every((k, i) => String(i) === k)) {
      return keys.map((k) => this.normalizeSwagger(swaggerObj[k], parentKey, method));
    }

    const enumValue = swaggerObj['enum'];
    if (enumValue && !Array.isArray(enumValue) && isRecord(enumValue)) {
      swaggerObj['enum'] = Object.values(enumValue);
    }

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
        swaggerObj['security'] = securityValue.filter(
          (v, i, a) =>
            i === a.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(v)),
        );
      }
    }

    if (parentKey === 'paths' && method && swaggerObj['requestBody']) {
      const methodUpper = method.toUpperCase();
      if (['GET', 'DELETE'].includes(methodUpper)) {
        delete swaggerObj['requestBody'];
      }
    }

    if (keys.includes('responses')) {
      const responses = swaggerObj['responses'];
      if (isRecord(responses)) {
        for (const status of Object.keys(responses)) {
          const response = responses[status];
          if (isRecord(response) && response['schema'] && !response['content']) {
            response['content'] = {
              'application/json': { schema: response['schema'] },
            };
            delete response['schema'];
          }
        }
      }
    }

    for (const key of keys) {
      const nextMethod = ['get', 'post', 'patch', 'delete', 'put'].includes(key)
        ? key
        : method;
      const nextParentKey = key === 'paths' ? key : parentKey;
      swaggerObj[key] = this.normalizeSwagger(swaggerObj[key], nextParentKey, nextMethod);
    }

    return swaggerObj;
  }

  isOpenApiObject(value: unknown): value is OpenAPIObject {
    return isRecord(value) && typeof value.openapi === 'string' && typeof value.info === 'object';
  }
}

