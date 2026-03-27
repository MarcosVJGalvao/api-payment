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
import { isRecord } from '@/common/errors/helpers/type.helpers';

function isExportResponse(value: unknown): value is ExportResponse {
  if (!isRecord(value)) {
    return false;
  }

  const headers = value['headers'];
  return (
    isRecord(headers) &&
    typeof value['contentType'] === 'string' &&
    typeof value['filename'] === 'string' &&
    'data' in value
  );
}

@Injectable()
export class ExportResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (isExportResponse(data)) {
          const exportResponse = data;
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
