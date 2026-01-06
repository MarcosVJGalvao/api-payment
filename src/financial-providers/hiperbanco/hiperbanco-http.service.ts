import { Injectable, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AppLoggerService } from '@/common/logger/logger.service';
import { HiperbancoResponseHelper } from './helpers/hiperbanco-response.helper';

export interface HiperbancoRequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, any>;
}

@Injectable()
export class HiperbancoHttpService {
    private readonly baseUrl: string;
    private readonly clientId: string;
    private readonly context = HiperbancoHttpService.name;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly logger: AppLoggerService,
    ) {
        this.baseUrl = this.configService.get<string>(
            'HIPERBANCO_API_URL',
            'https://sandbox.hiperbanco.com.br',
        );
        this.clientId = this.configService.get<string>('HIPERBANCO_CLIENT_ID') || '';

        if (!this.clientId) {
            this.logger.warn('HIPERBANCO_CLIENT_ID not set in environment variables.', this.context);
        }
    }

    getClientId(): string {
        if (!this.clientId) {
            throw new CustomHttpException(
                'Hiperbanco Client ID not configured',
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.PROVIDER_CLIENT_ID_NOT_CONFIGURED,
            );
        }
        return this.clientId;
    }

    private getDefaultHeaders(): Record<string, string> {
        return {
            version: 'cutting-edge',
            'Content-Type': 'application/json',
        };
    }

    private buildHeaders(options?: HiperbancoRequestOptions): Record<string, string> {
        return {
            ...this.getDefaultHeaders(),
            ...options?.headers,
        };
    }

    private sanitizePayload(data: Record<string, unknown>): Record<string, unknown> {
        if (!data) return {};
        const sanitized = { ...data };
        if (sanitized.password) sanitized.password = '***REDACTED***';
        return sanitized;
    }

    private logTransaction(
        method: string,
        url: string,
        statusCode: number,
        durationMs: number,
        requestHeaders: Record<string, string>,
        requestBody: unknown,
        responseBody: unknown,
        error?: string,
        stack?: string,
    ): void {
        const meta = {
            statusCode,
            request: {
                method,
                url,
                headers: requestHeaders,
                body: requestBody ? this.sanitizePayload(requestBody as Record<string, unknown>) : undefined,
            },
            response: responseBody,
            duration: `${durationMs}ms`,
            provider: 'Hiperbanco',
            ...(error && { message: error }),
            ...(stack && { stack }),
        };

        const isError = statusCode >= 400 || !!error;
        const message = isError ? 'Hiperbanco Request Failed' : 'Hiperbanco Request Success';

        this.logger.logWithContext(
            isError ? 'error' : 'log',
            message,
            meta,
            this.context
        );
    }

    private async executeRequest<T>(
        method: string,
        path: string,
        headers: Record<string, string>,
        requestData: Record<string, unknown> | undefined,
        execute: () => Promise<any>,
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const startTime = Date.now();

        try {
            const response = await execute();
            const duration = Date.now() - startTime;

            const logicalError = HiperbancoResponseHelper.getLogicalError(path, response.data);

            if (logicalError) {
                this.logTransaction(
                    method,
                    url,
                    response.status,
                    duration,
                    headers,
                    requestData,
                    response.data,
                    logicalError.message
                );
                throw new CustomHttpException(
                    `Hiperbanco request failed: ${logicalError.message}`,
                    logicalError.status,
                    ErrorCode.EXTERNAL_SERVICE_ERROR
                );
            }

            this.logTransaction(
                method,
                url,
                response.status,
                duration,
                headers,
                requestData,
                response.data
            );

            return response.data;
        } catch (error) {
            const duration = Date.now() - startTime;

            if (error instanceof CustomHttpException) {
                throw error;
            }

            const axiosError = error as { response?: { data?: unknown; status?: number }; message?: string; stack?: string };
            const message = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error';
            const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

            this.logTransaction(
                method,
                url,
                status,
                duration,
                headers,
                requestData,
                axiosError.response?.data,
                message,
                axiosError.stack
            );

            throw new CustomHttpException(
                `Hiperbanco request failed: ${message}`,
                status,
                ErrorCode.EXTERNAL_SERVICE_ERROR,
            );
        }
    }

    async get<T>(path: string, options?: HiperbancoRequestOptions): Promise<T> {
        const headers = this.buildHeaders(options);
        return this.executeRequest<T>(
            'GET',
            path,
            headers,
            options?.params,
            () => lastValueFrom(this.httpService.get(this.baseUrl + path, { headers, params: options?.params }))
        );
    }

    async post<T>(path: string, data: Record<string, unknown>, options?: HiperbancoRequestOptions): Promise<T> {
        const headers = this.buildHeaders(options);
        return this.executeRequest<T>(
            'POST',
            path,
            headers,
            data,
            () => lastValueFrom(this.httpService.post(this.baseUrl + path, data, { headers }))
        );
    }

    async put<T>(path: string, data: Record<string, unknown>, options?: HiperbancoRequestOptions): Promise<T> {
        const headers = this.buildHeaders(options);
        return this.executeRequest<T>(
            'PUT',
            path,
            headers,
            data,
            () => lastValueFrom(this.httpService.put(this.baseUrl + path, data, { headers }))
        );
    }

    async patch<T>(path: string, data: Record<string, unknown>, options?: HiperbancoRequestOptions): Promise<T> {
        const headers = this.buildHeaders(options);
        return this.executeRequest<T>(
            'PATCH',
            path,
            headers,
            data,
            () => lastValueFrom(this.httpService.patch(this.baseUrl + path, data, { headers }))
        );
    }

    async delete<T>(path: string, options?: HiperbancoRequestOptions): Promise<T> {
        const headers = this.buildHeaders(options);
        return this.executeRequest<T>(
            'DELETE',
            path,
            headers,
            options?.params,
            () => lastValueFrom(this.httpService.delete(this.baseUrl + path, { headers, params: options?.params }))
        );
    }
}
