import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { shouldSkipResponseTransform } from './helpers/response-transform-skip.helper';

@Injectable()
export class ConditionalClassSerializerInterceptor implements NestInterceptor {
  private readonly classSerializerInterceptor: ClassSerializerInterceptor;

  constructor(reflector: Reflector) {
    this.classSerializerInterceptor = new ClassSerializerInterceptor(reflector);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ url?: string; path?: string; method?: string }>();

    if (shouldSkipResponseTransform(request)) {
      return next.handle();
    }

    return this.classSerializerInterceptor.intercept(context, next);
  }
}
