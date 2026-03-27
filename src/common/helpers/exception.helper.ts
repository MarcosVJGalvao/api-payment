import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AppLoggerService } from '@/common/logger/logger.service';

export function getErrorMessageAndStack(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }

  return { message: String(error) };
}

export function getErrorMessage(error: unknown): string {
  return getErrorMessageAndStack(error).message;
}

export function getErrorTrace(error: unknown): string {
  const { message, stack } = getErrorMessageAndStack(error);
  return stack ?? message;
}

/**
 * Trata exceções genéricas, logando o erro e lançando uma CustomHttpException padronizada.
 * Se o erro já for uma CustomHttpException, ele é relançado sem alterações.
 *
 * @param error - O erro capturado (unknown).
 * @param logger - Instância do logger (opcional).
 * @param context - Contexto para o log (ex: Nome do Serviço).
 * @param logMessage - Mensagem principal para o log.
 * @param userMessagePrefix - Prefixo para a mensagem de erro retornada ao usuário/cliente.
 * @param errorCode - Código de erro interno (padrão: INTERNAL_SERVER_ERROR).
 * @param status - Status HTTP (padrão: INTERNAL_SERVER_ERROR).
 */
export function handleGenericException(
  error: unknown,
  context: string,
  logMessage: string,
  userMessagePrefix: string,
  logger?: AppLoggerService,
  errorCode: ErrorCode = ErrorCode.UNEXPECTED_ERROR,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
): never {
  if (error instanceof CustomHttpException) {
    throw error;
  }

  const { message: errorMessage, stack } = getErrorMessageAndStack(error);

  logger?.error(logMessage, stack || errorMessage, context);

  throw new CustomHttpException(
    `${userMessagePrefix}: ${errorMessage}`,
    status,
    errorCode,
  );
}
