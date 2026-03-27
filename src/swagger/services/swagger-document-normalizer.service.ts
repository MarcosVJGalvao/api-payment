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
      return keys.map((k) =>
        this.normalizeSwagger(swaggerObj[k], parentKey, method),
      );
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
            i ===
            a.findIndex(
              (candidate) => JSON.stringify(candidate) === JSON.stringify(v),
            ),
        );
      }
    }

    if (parentKey === 'paths' && method && swaggerObj['requestBody']) {
      const methodUpper = method.toUpperCase();
      if (['GET', 'DELETE'].includes(methodUpper)) {
        delete swaggerObj['requestBody'];
      }
    }

    if (parentKey === 'paths' && method) {
      this.normalizeOperationHeaderParameters(swaggerObj);
    }

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
      swaggerObj[key] = this.normalizeSwagger(
        swaggerObj[key],
        nextParentKey,
        nextMethod,
      );
    }

    return swaggerObj;
  }

  private normalizeOperationHeaderParameters(
    operation: Record<string, unknown>,
  ): void {
    const rawParameters = operation['parameters'];
    if (!Array.isArray(rawParameters) || rawParameters.length === 0) return;

    const grouped = new Map<string, Record<string, unknown>>();
    const passthrough: unknown[] = [];

    for (const parameter of rawParameters) {
      if (!isRecord(parameter)) {
        passthrough.push(parameter);
        continue;
      }

      const location = parameter['in'];
      const name = parameter['name'];
      if (typeof location !== 'string' || typeof name !== 'string') {
        passthrough.push(parameter);
        continue;
      }

      const normalizedLocation = location.toLowerCase();
      const normalizedName = name.toLowerCase();
      const key = `${normalizedLocation}:${normalizedName}`;

      const current = grouped.get(key);
      if (!current) {
        const initial = { ...parameter };
        if (normalizedLocation === 'header') {
          initial['name'] = this.getCanonicalHeaderName(name);
        }
        grouped.set(key, initial);
        continue;
      }

      grouped.set(
        key,
        this.mergeSwaggerParameter(current, parameter, normalizedLocation),
      );
    }

    operation['parameters'] = [...passthrough, ...grouped.values()];
  }

  private mergeSwaggerParameter(
    existing: Record<string, unknown>,
    candidate: Record<string, unknown>,
    normalizedLocation: string,
  ): Record<string, unknown> {
    const existingScore = Object.keys(existing).length;
    const candidateScore = Object.keys(candidate).length;
    const base =
      candidateScore > existingScore ? { ...candidate } : { ...existing };
    const fallback = candidateScore > existingScore ? existing : candidate;

    for (const [key, value] of Object.entries(fallback)) {
      if (base[key] === undefined) {
        base[key] = value;
      }
    }

    if (normalizedLocation === 'header' && typeof base['name'] === 'string') {
      base['name'] = this.getCanonicalHeaderName(base['name']);
    }

    return base;
  }

  private getCanonicalHeaderName(name: string): string {
    const normalized = name.toLowerCase();
    if (normalized === 'x-client-id') return 'X-Client-Id';
    if (normalized === 'x-account-id') return 'X-Account-Id';
    return name;
  }

  isOpenApiObject(value: unknown): value is OpenAPIObject {
    return (
      isRecord(value) &&
      typeof value.openapi === 'string' &&
      typeof value.info === 'object'
    );
  }
}
