import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export class CustomHttpException extends HttpException {
  public readonly errorCode: ErrorCode | string;
  public readonly customMessage: string | string[];
  public readonly data?: Record<string, unknown>;

  constructor(
    message: string | string[],
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    errorCode: ErrorCode | string,
    data?: Record<string, unknown>,
  ) {
    super(
      {
        errorCode,
        message,
        data,
      },
      statusCode,
    );
    this.errorCode = errorCode;
    this.customMessage = message;
    this.data = data;
  }
}
