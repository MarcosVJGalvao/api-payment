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
export class RemoveNestedTimestampsInterceptor implements NestInterceptor {
  private readonly timestampFields = ['createdAt', 'updatedAt', 'deletedAt'];
  private readonly maxDepth: number;
  private visitedObjects: WeakSet<object>;

  constructor(maxDepth: number = 20) {
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
        return this.removeNestedTimestamps(data, 0, true);
      }),
    );
  }

  /**
   * Remove campos de timestamp recursivamente de objetos aninhados.
   * Mantém os campos no objeto raiz (primeiro nível) e nos itens do array principal.
   * @param data - Dados a serem processados
   * @param depth - Profundidade atual da recursão
   * @param isRoot - Se é o objeto raiz (primeiro nível)
   * @param isArrayItemRoot - Se os itens do array devem ser tratados como root (para manter timestamps)
   * @returns Dados processados sem timestamps aninhados
   */
  private removeNestedTimestamps(
    data: unknown,
    depth: number,
    isRoot: boolean = false,
    isArrayItemRoot: boolean = false,
  ): unknown {
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
      return data.map((item) =>
        this.removeNestedTimestamps(item, depth + 1, isArrayItemRoot, false),
      );
    }

    if (data instanceof Map) {
      this.visitedObjects.add(data);
      const processedMap = new Map();
      for (const [key, value] of data.entries()) {
        processedMap.set(
          key,
          this.removeNestedTimestamps(value, depth + 1, false, false),
        );
      }
      return processedMap;
    }

    if (data instanceof Set) {
      this.visitedObjects.add(data);
      const processedSet = new Set();
      for (const value of data.values()) {
        processedSet.add(
          this.removeNestedTimestamps(value, depth + 1, false, false),
        );
      }
      return processedSet;
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
          data: this.removeNestedTimestamps(
            dataObj.data,
            depth + 1,
            false,
            true,
          ),
          meta: dataObj.meta,
        };
      }

      const processed: Record<string, unknown> = {};

      for (const key of Object.keys(dataObj)) {
        const isTimestampField = this.timestampFields.includes(key);

        if (!isRoot && isTimestampField) {
          continue;
        }

        processed[key] = this.removeNestedTimestamps(
          dataObj[key],
          depth + 1,
          false,
          false,
        );
      }

      return processed;
    }

    return data;
  }
}
