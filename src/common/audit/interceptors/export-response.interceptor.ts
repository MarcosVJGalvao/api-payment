import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ExportResponse } from '../interfaces/export-response.interface';

@Injectable()
export class ExportResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'headers' in data &&
          'contentType' in data &&
          'filename' in data &&
          'data' in data
        ) {
          const exportResponse = data as ExportResponse;
          response.setHeader(
            'Content-Type',
            exportResponse.headers['Content-Type'],
          );
          response.setHeader(
            'Content-Disposition',
            exportResponse.headers['Content-Disposition'],
          );
          return exportResponse.data;
        }
        return data;
      }),
    );
  }
}
