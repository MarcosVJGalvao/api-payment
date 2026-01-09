import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AppLoggerService } from '@/common/logger/logger.service';
import { HiperbancoRequestOptions } from './interfaces/hiperbanco-responses.interface';
import { buildHeaders } from './helpers/hiperbanco-header.helper';
import { executeHiperbancoRequest } from './helpers/hiperbanco-request.helper';
import type { HiperbancoConfig } from './helpers/hiperbanco-config.helper';

@Injectable()
export class HiperbancoHttpService {
  private readonly context = HiperbancoHttpService.name;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
    @Inject('HIPERBANCO_CONFIG') private readonly config: HiperbancoConfig,
  ) {}

  private getRequestConfig() {
    return {
      baseUrl: this.config.baseUrl,
      logger: this.logger,
      context: this.context,
    };
  }

  async get<T>(path: string, options?: HiperbancoRequestOptions): Promise<T> {
    const headers = buildHeaders(options);
    return executeHiperbancoRequest<T>(
      'GET',
      path,
      headers,
      options?.params,
      () =>
        lastValueFrom(
          this.httpService.get(this.config.baseUrl + path, {
            headers,
            params: options?.params,
          }),
        ),
      this.getRequestConfig(),
    );
  }

  async post<T>(
    path: string,
    data: Record<string, unknown>,
    options?: HiperbancoRequestOptions,
  ): Promise<T> {
    const headers = buildHeaders(options);
    return executeHiperbancoRequest<T>(
      'POST',
      path,
      headers,
      data,
      () =>
        lastValueFrom(
          this.httpService.post(this.config.baseUrl + path, data, { headers }),
        ),
      this.getRequestConfig(),
    );
  }

  async put<T>(
    path: string,
    data: Record<string, unknown>,
    options?: HiperbancoRequestOptions,
  ): Promise<T> {
    const headers = buildHeaders(options);
    return executeHiperbancoRequest<T>(
      'PUT',
      path,
      headers,
      data,
      () =>
        lastValueFrom(
          this.httpService.put(this.config.baseUrl + path, data, { headers }),
        ),
      this.getRequestConfig(),
    );
  }

  async patch<T>(
    path: string,
    data: Record<string, unknown>,
    options?: HiperbancoRequestOptions,
  ): Promise<T> {
    const headers = buildHeaders(options);
    return executeHiperbancoRequest<T>(
      'PATCH',
      path,
      headers,
      data,
      () =>
        lastValueFrom(
          this.httpService.patch(this.config.baseUrl + path, data, { headers }),
        ),
      this.getRequestConfig(),
    );
  }

  async delete<T>(
    path: string,
    data?: Record<string, unknown>,
    options?: HiperbancoRequestOptions,
  ): Promise<T> {
    const headers = buildHeaders(options);
    return executeHiperbancoRequest<T>(
      'DELETE',
      path,
      headers,
      data,
      () =>
        lastValueFrom(
          this.httpService.delete(this.config.baseUrl + path, {
            headers,
            params: options?.params,
            data,
          }),
        ),
      this.getRequestConfig(),
    );
  }
}
