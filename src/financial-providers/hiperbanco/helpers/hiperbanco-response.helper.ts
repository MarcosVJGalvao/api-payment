import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

export interface LogicalError {
  message: string;
  status: number;
  errorCode?: string;
}

/**
 * Validador de respostas do Hiperbanco
 * Identifica erros lógicos em respostas com status HTTP de sucesso
 */
export class HiperbancoResponseHelper {
  /**
   * Verifica se houve erro lógico no corpo da resposta
   * @param path - Caminho da requisição
   * @param responseData - Dados retornados pela API
   * @returns Objeto com erro se encontrado, ou null se sucesso
   */
  static getLogicalError(
    path: string,
    responseData: unknown,
  ): LogicalError | null {
    // Regra específica para login de Backoffice
    if (path.includes('/Backoffice/Login')) {
      if (
        responseData &&
        typeof responseData === 'object' &&
        'status' in responseData
      ) {
        const data = responseData as {
          status: unknown;
          data?: string;
          message?: string;
          errorCode?: string;
        };
        const logicalStatus = Number(data.status);

        if (!isNaN(logicalStatus) && logicalStatus >= 400) {
          const message =
            data.data || data.message || 'Hiperbanco logical error';

          return {
            message: String(message),
            status:
              logicalStatus >= 100 && logicalStatus < 600
                ? logicalStatus
                : HttpStatus.BAD_REQUEST,
            errorCode: data.errorCode,
          };
        }
      }
    }
    return null;
  }
}
