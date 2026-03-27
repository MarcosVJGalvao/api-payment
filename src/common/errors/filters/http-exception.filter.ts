import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomHttpException } from '../exceptions/custom-http.exception';
import { ErrorCode } from '../enums/error-code.enum';
import { formatRequest } from '../helpers/request.helpers';
import { getTimestamp } from '../helpers/timestamp.helpers';
import { extractMessage } from '../helpers/message.helpers';
import {
  processHttpException,
  processUnhandledError,
} from '../helpers/error.helpers';
import { ThrottlerException } from '@nestjs/throttler';
import { AppLoggerService } from '@/common/logger/logger.service';
import { extractModuleFromUrl } from '@/common/logger/helpers/url-module.helper';

function hasMessageProperty(value: unknown): value is { message?: unknown } {
  return typeof value === 'object' && value !== null && 'message' in value;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  private logException(
    correlationId: string,
    type: string,
    status: HttpStatus,
    errorCode: ErrorCode | string,
    message: string | string[],
    request: Request,
    stack?: string,
    errorName?: string,
  ) {
    const moduleName = extractModuleFromUrl(request.url);

    const logData = {
      timestamp: getTimestamp(),
      statusCode: status,
      request: formatRequest(request),
      response: {
        errorCode: errorCode,
        message,
        correlationId,
      },
      ...(errorName && { error: { name: errorName, message } }),
      ...(stack && { stack }),
      // Add module name to metadata
      module: moduleName,
    };

    // Use module name as context instead of 'HttpExceptionFilter'
    this.logger.logWithContext(
      'error',
      `[${correlationId}] ${type}`,
      logData,
      moduleName,
    );
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const correlationId = String(request.correlationId || '');

    let status: HttpStatus;
    let errorCode: ErrorCode | string;
    let message: string | string[];
    let data: Record<string, unknown> | undefined;

    if (exception instanceof CustomHttpException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.customMessage;
      data = exception.data;

      this.logException(
        correlationId,
        'CustomHttpException',
        status,
        errorCode,
        message,
        request,
        exception.stack,
      );
    } else if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      errorCode = ErrorCode.TOO_MANY_REQUESTS;
      const exceptionResponse = exception.getResponse();
      let exceptionMessage: string | string[] | undefined;
      if (hasMessageProperty(exceptionResponse)) {
        const msg = exceptionResponse.message;
        if (typeof msg === 'string' || Array.isArray(msg)) {
          exceptionMessage = msg;
        }
      }
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionMessage ?? 'Too many requests');

      this.logException(
        correlationId,
        'ThrottlerException',
        status,
        errorCode,
        message,
        request,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const result = processHttpException(
        status,
        exceptionResponse,
        extractMessage,
      );

      errorCode = result.errorCode;
      message = result.message;

      this.logException(
        correlationId,
        'HttpException',
        status,
        errorCode,
        message,
        request,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      const result = processUnhandledError(exception);

      status = result.status;
      errorCode = result.errorCode;
      message = result.message;

      this.logException(
        correlationId,
        'Unhandled Error',
        status,
        errorCode,
        message,
        request,
        exception instanceof Error ? exception.stack : undefined,
        exception instanceof Error ? exception.name : undefined,
      );
    }

    response.setHeader('X-Correlation-ID', correlationId);
    response.status(status).json({
      errorCode: errorCode,
      message,
      correlationId,
      ...(data && { data }),
    });
  }
}
