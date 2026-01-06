import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ConditionalClassSerializerInterceptor implements NestInterceptor {
  private readonly classSerializerInterceptor: ClassSerializerInterceptor;
  private readonly excludedPaths: Set<string> = new Set([
    '/api/docs/openapi.json',
    '/api/docs/verify-json',
    '/api/docs',
    '/api-json',
  ]);

  constructor(reflector: Reflector) {
    this.classSerializerInterceptor = new ClassSerializerInterceptor(reflector);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ url?: string; path?: string; method?: string }>();
    const path: string = request.url || request.path || '';
    const method: string = request.method || '';

    if (this.isExcludedPath(path)) {
      return next.handle();
    }

    if (this.isDownloadPath(path)) {
      return next.handle();
    }

    if (path === '/reports' && method === 'POST') {
      return next.handle();
    }

    return this.classSerializerInterceptor.intercept(context, next);
  }

  private isExcludedPath(path: string): boolean {
    if (!path) {
      return false;
    }

    for (const excludedPath of this.excludedPaths) {
      if (excludedPath === '/api/docs') {
        if (path.startsWith('/api/docs')) {
          return true;
        }
      } else if (path === excludedPath || path.startsWith(excludedPath)) {
        return true;
      }
    }

    return false;
  }

  private isDownloadPath(path: string): boolean {
    if (!path) {
      return false;
    }

    return path.endsWith('/download') || path.endsWith('/export');
  }
}
