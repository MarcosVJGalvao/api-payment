import { AppLoggerService } from '@/common/logger/logger.service';
import { HiperbancoResponseHelper } from './hiperbanco-response.helper';
import { handleHiperbancoError } from './hiperbanco-error.helper';
import { logTransaction } from './hiperbanco-logger.helper';

import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

export interface HiperbancoRequestConfig {
    baseUrl: string;
    logger: AppLoggerService;
    context: string;
}

/**
 * Executa uma requisição à API do Hiperbanco, tratando logs e erros de forma padronizada.
 * 
 * @param method Método HTTP
 * @param path Caminho do endpoint
 * @param headers Cabeçalhos da requisição
 * @param requestData Payload da requisição
 * @param execute Callback que realiza a requisição HTTP real
 * @param config Objeto de configuração contendo baseUrl, logger e context
 */
export async function executeHiperbancoRequest<T>(
    method: string,
    path: string,
    headers: Record<string, string>,
    requestData: Record<string, unknown> | undefined,
    execute: () => Promise<any>,
    config: HiperbancoRequestConfig
): Promise<T> {
    const url = `${config.baseUrl}${path}`;
    const startTime = Date.now();

    try {
        const response = await execute();
        const duration = Date.now() - startTime;

        const logicalError = HiperbancoResponseHelper.getLogicalError(path, response.data);

        if (logicalError) {
            logTransaction(
                config.logger,
                config.context,
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
                (logicalError.errorCode as ErrorCode) || ErrorCode.EXTERNAL_SERVICE_ERROR
            );
        }

        logTransaction(
            config.logger,
            config.context,
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
        handleHiperbancoError(
            error,
            (status, responseData, message, stack) => {
                logTransaction(
                    config.logger,
                    config.context,
                    method,
                    url,
                    status,
                    duration,
                    headers,
                    requestData,
                    responseData,
                    message,
                    stack
                );
            }
        );
    }
}
