import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RemoveSensitiveFieldsInterceptor implements NestInterceptor {
  private readonly sensitiveFields: Set<string>;
  private readonly maxDepth: number;
  private visitedObjects: WeakSet<object>;

  /**
   * Cria uma instância do interceptor.
   * @param sensitiveFields - Array de nomes de campos sensíveis. Se não fornecido,
   *                          usa SENSITIVE_FIELDS do env ou padrão ['password']
   * @param maxDepth - Profundidade máxima para recursão (padrão: 20)
   */
  constructor(sensitiveFields?: string[], maxDepth: number = 20) {
    const envFields =
      process.env.SENSITIVE_FIELDS?.split(',').map((f) => f.trim()) || [];
    const fields =
      sensitiveFields || (envFields.length > 0 ? envFields : ['password']);

    this.sensitiveFields = new Set(fields.map((field) => field.toLowerCase()));
    this.maxDepth = maxDepth;
    this.visitedObjects = new WeakSet();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const path = request.url || request.path;

    if (
      path?.startsWith('/api/docs') ||
      path?.startsWith('/api-json') ||
      path === '/api'
    ) {
      return next.handle();
    }

    if (path?.endsWith('/download') || path?.endsWith('/export')) {
      return next.handle();
    }

    if (path === '/reports' && request.method === 'POST') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        if (data instanceof StreamableFile) {
          return data;
        }
        this.visitedObjects = new WeakSet();
        return this.sanitize(data, 0);
      }),
    );
  }

  /**
   * Remove campos sensíveis recursivamente de um valor.
   * Suporta: objetos, arrays, Map, Set, resultados paginados e entidades TypeORM.
   * @param data - Dados a serem sanitizados
   * @param depth - Profundidade atual da recursão
   * @returns Dados sanitizados sem campos sensíveis
   */
  private sanitize(data: unknown, depth: number): unknown {
    if (depth > this.maxDepth) {
      return data;
    }

    if (data === null || data === undefined) {
      return data;
    }

    if (
      typeof data !== 'object' ||
      data instanceof Date ||
      data instanceof RegExp ||
      data instanceof Buffer ||
      data instanceof Error
    ) {
      return data;
    }

    if (typeof data === 'object' && this.visitedObjects.has(data)) {
      return data;
    }

    if (Array.isArray(data)) {
      this.visitedObjects.add(data);
      return data.map((item) => this.sanitize(item, depth + 1));
    }

    if (data instanceof Map) {
      this.visitedObjects.add(data);
      const sanitizedMap = new Map();
      for (const [key, value] of data.entries()) {
        sanitizedMap.set(key, this.sanitize(value, depth + 1));
      }
      return sanitizedMap;
    }

    if (data instanceof Set) {
      this.visitedObjects.add(data);
      const sanitizedSet = new Set();
      for (const value of data.values()) {
        sanitizedSet.add(this.sanitize(value, depth + 1));
      }
      return sanitizedSet;
    }

    if (typeof data === 'object') {
      this.visitedObjects.add(data);
      const dataObj = data as Record<string, unknown>;

      if (
        'data' in dataObj &&
        'meta' in dataObj &&
        Array.isArray(dataObj.data)
      ) {
        return {
          ...dataObj,
          data: this.sanitize(dataObj.data, depth + 1),
          meta: dataObj.meta,
        };
      }

      const sanitized: Record<string, unknown> = {};

      for (const key of Object.keys(dataObj)) {
        const lowerKey = key.toLowerCase();

        if (this.sensitiveFields.has(lowerKey)) {
          continue;
        }

        try {
          sanitized[key] = this.sanitize(dataObj[key], depth + 1);
        } catch {
          continue;
        }
      }

      return sanitized;
    }

    return data;
  }
}
