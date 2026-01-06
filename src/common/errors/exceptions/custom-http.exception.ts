import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export class CustomHttpException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly customMessage: string | string[];

  constructor(
    message: string | string[],
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    errorCode: ErrorCode,
  ) {
    super(
      {
        errorCode,
        message,
      },
      statusCode,
    );
    this.errorCode = errorCode;
    this.customMessage = message;
  }
}
