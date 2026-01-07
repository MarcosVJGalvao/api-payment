/**
 * Error processing helpers
 */

import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';
import { toLowerCase, includesString } from './string.helpers';

export function mapHttpStatusToErrorCode(status: HttpStatus): ErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.INVALID_INPUT;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.ACCESS_DENIED;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCode.TOO_MANY_REQUESTS;
    case HttpStatus.INTERNAL_SERVER_ERROR:
    default:
      return ErrorCode.UNEXPECTED_ERROR;
  }
}

export function processHttpException(
  status: HttpStatus,
  exceptionResponse: any,
  extractMessage: (response: any) => string | string[],
): { errorCode: ErrorCode; message: string | string[] } {
  if (status === HttpStatus.TOO_MANY_REQUESTS) {
    return {
      errorCode: ErrorCode.TOO_MANY_REQUESTS,
      message: 'Too many requests',
    };
  }

  if (
    status === HttpStatus.BAD_REQUEST &&
    typeof exceptionResponse === 'object' &&
    exceptionResponse !== null &&
    'message' in exceptionResponse
  ) {
    const message = extractMessage(exceptionResponse);
    return {
      errorCode: ErrorCode.INVALID_INPUT,
      message,
    };
  }

  return {
    errorCode: mapHttpStatusToErrorCode(status),
    message: extractMessage(exceptionResponse),
  };
}

export function processUnhandledError(error: Error): {
  errorCode: ErrorCode;
  message: string;
  status: HttpStatus;
} {
  const errorMessage = toLowerCase(error?.message || '');
  const isDatabaseError =
    error?.name === 'QueryFailedError' ||
    error?.name === 'TypeORMError' ||
    includesString(errorMessage, 'relation') ||
    includesString(errorMessage, 'join') ||
    includesString(errorMessage, 'alias') ||
    includesString(errorMessage, 'column') ||
    includesString(errorMessage, 'field') ||
    includesString(errorMessage, 'sql');

  if (isDatabaseError) {
    return {
      errorCode: ErrorCode.INVALID_QUERY_RELATION,
      message: 'Invalid query configuration.',
      status: HttpStatus.BAD_REQUEST,
    };
  }

  return {
    errorCode: ErrorCode.UNEXPECTED_ERROR,
    message: 'Internal server error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  };
}
