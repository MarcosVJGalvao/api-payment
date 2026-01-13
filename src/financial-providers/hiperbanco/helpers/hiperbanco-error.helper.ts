import { HttpStatus } from '@nestjs/common';
import { AxiosError, isAxiosError } from 'axios';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
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
    stack: string | undefined,
  ) => void,
): never {
  if (error instanceof CustomHttpException) {
    throw error;
  }

  let message = 'Unknown error';
  let status = HttpStatus.INTERNAL_SERVER_ERROR;
  let responseData: unknown = undefined;
  let stack: string | undefined = undefined;

  let errorCode: string | undefined = undefined;
  let errorData: Record<string, unknown> | undefined = undefined;

  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;
    responseData = axiosError.response?.data;

    // Se não houver response, é erro de rede/timeout - usar Bad Gateway
    if (!axiosError.response) {
      status = HttpStatus.BAD_GATEWAY;
      message =
        axiosError.code === 'ECONNABORTED' ||
        axiosError.message.includes('timeout')
          ? 'Request timeout while communicating with external service'
          : 'Failed to communicate with external service';
      errorCode = ErrorCode.EXTERNAL_SERVICE_COMMUNICATION_ERROR;
    } else {
      status = axiosError.response.status;
      message = axiosError.message;
    }

    if (isHiperbancoErrorResponse(responseData)) {
      if (responseData.message) {
        message = responseData.message;
      }
      if (responseData.errorCode) {
        // Normaliza erro de sessão expirada
        if (responseData.errorCode === 'EXPIRED_SESSION') {
          errorCode = ErrorCode.SESSION_EXPIRED;
        } else {
          errorCode = responseData.errorCode;
        }
      }
      if (responseData.data) {
        errorData = responseData.data;
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
    `Provider request failed: ${message}`,
    status,
    errorCode || ErrorCode.EXTERNAL_SERVICE_ERROR,
    errorData,
  );
}
