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

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const response = ctx.getResponse<Response>();

    const correlationId = String(request.correlationId || '');
    const moduleName = extractModuleFromUrl(request.url);

    // Capture request data
    const requestData = formatRequest(request);

    // Store response data
    let responseBody: any = null;
    const responseHeaders: Record<string, any> = {};

    // Capture response when it finishes
    response.on('finish', () => {
      // Only log successful requests (2xx status codes)
      const statusCode = response.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        // Get response headers and filter out unnecessary ones
        const allHeaders = { ...response.getHeaders() };

        // Extract content-type separately
        const contentType =
          allHeaders['content-type'] || allHeaders['Content-Type'] || null;

        // Remove headers that are not needed in logs
        const headersToRemove = [
          'x-powered-by',
          'access-control-allow-origin',
          'x-correlation-id',
          'x-ratelimit-limit',
          'x-ratelimit-remaining',
          'x-ratelimit-reset',
          'content-type',
          'Content-Type',
          'content-length',
          'Content-Length',
          'etag',
          'ETag',
        ];

        const filteredHeaders: Record<string, any> = {};
        Object.keys(allHeaders).forEach((key) => {
          if (!headersToRemove.includes(key.toLowerCase())) {
            filteredHeaders[key] = allHeaders[key];
          }
        });

        // Spread response body fields directly into response object
        // Note: statusCode is already at root level, so we don't include it here
        const responseData: Record<string, any> = {
          'content-type': contentType,
          headers:
            Object.keys(filteredHeaders).length > 0
              ? filteredHeaders
              : undefined,
          correlationId,
        };

        // If responseBody is an object, spread its fields into response
        if (
          responseBody &&
          typeof responseBody === 'object' &&
          !Array.isArray(responseBody)
        ) {
          Object.assign(responseData, responseBody);
        } else if (responseBody) {
          // If it's not an object, keep it as 'body'
          responseData.body = responseBody;
        }

        const logData = {
          timestamp: getTimestamp(),
          statusCode,
          request: requestData,
          response: responseData,
          // Add module name to metadata
          module: moduleName,
        };

        // Use module name as context instead of 'RequestLoggingInterceptor'
        this.logger.logWithContext(
          'log',
          `[${correlationId}] HTTP Request Success`,
          logData,
          moduleName,
        );
      }
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Capture response body from the observable data
          if (data !== undefined) {
            responseBody = data;
          }
        },
        error: (error) => {
          // Errors are already logged by HttpExceptionFilter, so we don't log them here
        },
      }),
    );
  }
}
