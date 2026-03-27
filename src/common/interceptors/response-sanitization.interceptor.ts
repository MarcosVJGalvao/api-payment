import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import { shouldSkipResponseTransform } from './helpers/response-transform-skip.helper';

@Injectable()
export class ResponseSanitizationInterceptor implements NestInterceptor {
  private readonly sensitiveFields: Set<string>;
  private readonly timestampFields = new Set([
    'createdAt',
    'updatedAt',
    'deletedAt',
  ]);
  private readonly maxDepth: number;
  private visitedObjects: WeakSet<object>;

  constructor(sensitiveFields?: string[], maxDepth: number = 20) {
    const envFields =
      process.env.SENSITIVE_FIELDS?.split(',').map((field) => field.trim()) ||
      [];
    const fields =
      sensitiveFields || (envFields.length > 0 ? envFields : ['password']);

    this.sensitiveFields = new Set(fields.map((field) => field.toLowerCase()));
    this.maxDepth = maxDepth;
    this.visitedObjects = new WeakSet();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ url?: string; path?: string; method?: string }>();

    if (shouldSkipResponseTransform(request)) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        if (data instanceof StreamableFile) {
          return data;
        }
        this.visitedObjects = new WeakSet();
        return this.sanitize(data, 0, true, false);
      }),
    );
  }

  private sanitize(
    data: unknown,
    depth: number,
    isRoot: boolean,
    isArrayItemRoot: boolean,
  ): unknown {
    if (depth > this.maxDepth || data === null || data === undefined) {
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

    if (this.visitedObjects.has(data)) {
      return data;
    }

    if (Array.isArray(data)) {
      this.visitedObjects.add(data);
      return data.map((item) =>
        this.sanitize(item, depth + 1, isArrayItemRoot, false),
      );
    }

    if (data instanceof Map) {
      this.visitedObjects.add(data);
      const sanitizedMap = new Map();
      for (const [key, value] of data.entries()) {
        sanitizedMap.set(key, this.sanitize(value, depth + 1, false, false));
      }
      return sanitizedMap;
    }

    if (data instanceof Set) {
      this.visitedObjects.add(data);
      const sanitizedSet = new Set();
      for (const value of data.values()) {
        sanitizedSet.add(this.sanitize(value, depth + 1, false, false));
      }
      return sanitizedSet;
    }

    if (!isRecord(data)) {
      return data;
    }

    this.visitedObjects.add(data);
    const dataObj = data;

    if ('data' in dataObj && 'meta' in dataObj && Array.isArray(dataObj.data)) {
      return {
        ...dataObj,
        data: this.sanitize(dataObj.data, depth + 1, false, true),
        meta: dataObj.meta,
      };
    }

    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(dataObj)) {
      const lowerKey = key.toLowerCase();
      const isTimestampField = this.timestampFields.has(key);
      if (this.sensitiveFields.has(lowerKey)) {
        continue;
      }
      if (!isRoot && isTimestampField) {
        continue;
      }

      try {
        sanitized[key] = this.sanitize(dataObj[key], depth + 1, false, false);
      } catch {
        continue;
      }
    }

    return sanitized;
  }
}
