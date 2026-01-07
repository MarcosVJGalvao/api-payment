import { HttpStatus } from '@nestjs/common';
import { AxiosError, isAxiosError } from 'axios';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HiperbancoErrorResponse } from '../interfaces/hiperbanco-responses.interface';
import { isHiperbancoErrorResponse } from './hiperbanco-validators.helper';

/**
 * Tratamento centralizado de erros de requisição para o Hiperbanco e outras integrações HTTP.
 * Analisa o erro (Axios ou genérico), invoca o callback de log com os detalhes extraídos
 * e lança uma CustomHttpException padronizada.
 * 
 * @param error O erro capturado (unknown)
 * @param logCallback Callback para realizar o log da transação com os dados processados do erro
 * @throws CustomHttpException
 */

export function handleHiperbancoError(
    error: unknown,
    logCallback: (
        status: number,
        responseData: unknown,
        message: string,
        stack: string | undefined
    ) => void
): never {
    if (error instanceof CustomHttpException) {
        throw error;
    }

    let message = 'Unknown error';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseData: unknown = undefined;
    let stack: string | undefined = undefined;

    let errorCode: string | undefined = undefined;

    if (isAxiosError(error)) {
        const axiosError = error as AxiosError;
        responseData = axiosError.response?.data;
        status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

        message = axiosError.message;

        if (isHiperbancoErrorResponse(responseData)) {
            if (responseData.message) {
                message = responseData.message;
            }
            if (responseData.errorCode) {
                errorCode = responseData.errorCode;
            }
        }

        stack = axiosError.stack;
    } else if (error instanceof Error) {
        message = error.message;
        stack = error.stack;
    }

    // Invoca o callback de log fornecido pelo serviço
    logCallback(status, responseData, message, stack);

    throw new CustomHttpException(
        `Hiperbanco request failed: ${message}`,
        status,
        errorCode || ErrorCode.EXTERNAL_SERVICE_ERROR,
    );
}
