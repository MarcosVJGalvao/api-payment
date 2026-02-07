import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger.service';
import { formatRequest } from '@/common/errors/helpers/request.helpers';
import { getTimestamp } from '@/common/errors/helpers/timestamp.helpers';
import { extractModuleFromUrl } from '../helpers/url-module.helper';

const REDUNDANT_HEADERS = new Set([
  'x-powered-by',
  'access-control-allow-origin',
  'x-correlation-id',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'content-type',
  'content-length',
  'etag',
]);

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const response = ctx.getResponse<Response>();

    const correlationId = String(request.correlationId || '');
    const moduleName = extractModuleFromUrl(request.url);

    // Store response data
    let responseBody: any = null;

    // Capture response when it finishes
    response.once('finish', () => {
      // Only log successful requests (2xx status codes)
      const statusCode = response.statusCode;
      if (statusCode < 200 || statusCode >= 300) {
        return;
      }

      const requestData = formatRequest(request);
      const allHeaders = response.getHeaders();
      const contentType =
        allHeaders['content-type'] || allHeaders['Content-Type'] || null;

      const filteredHeaders: Record<string, any> = {};
      for (const [key, value] of Object.entries(allHeaders)) {
        if (!REDUNDANT_HEADERS.has(key.toLowerCase())) {
          filteredHeaders[key] = value;
        }
      }

      const responseData: Record<string, any> = {
        'content-type': contentType,
        headers:
          Object.keys(filteredHeaders).length > 0 ? filteredHeaders : undefined,
        correlationId,
      };

      if (responseBody && typeof responseBody === 'object' && !Array.isArray(responseBody)) {
        Object.assign(responseData, responseBody);
      } else if (responseBody) {
        responseData.body = responseBody;
      }

      const logData = {
        timestamp: getTimestamp(),
        statusCode,
        request: requestData,
        response: responseData,
        module: moduleName,
      };

      this.logger.logWithContext(
        'log',
        `[${correlationId}] HTTP Request Success`,
        logData,
        moduleName,
      );
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (data !== undefined) {
            responseBody = data;
          }
        },
        error: () => undefined,
      }),
    );
  }
}
