import { HttpStatus } from '@nestjs/common';
import { isRecord } from '@/common/errors/helpers/type.helpers';

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
      if (isRecord(responseData) && 'status' in responseData) {
        const statusValue = responseData['status'];
        const logicalStatus = Number(statusValue);

        if (!isNaN(logicalStatus) && logicalStatus >= 400) {
          const dataMessage = responseData['data'];
          const messageValue = responseData['message'];
          const message =
            (typeof dataMessage === 'string' && dataMessage) ||
            (typeof messageValue === 'string' && messageValue) ||
            'Hiperbanco logical error';

          return {
            message: String(message),
            status:
              logicalStatus >= 100 && logicalStatus < 600
                ? logicalStatus
                : HttpStatus.BAD_REQUEST,
            errorCode:
              typeof responseData['errorCode'] === 'string'
                ? responseData['errorCode']
                : undefined,
          };
        }
      }
    }
    return null;
  }
}
