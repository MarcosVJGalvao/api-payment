import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AppLoggerService } from '@/common/logger/logger.service';

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

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger?.error(logMessage, stack || errorMessage, context);

    throw new CustomHttpException(
        `${userMessagePrefix}: ${errorMessage}`,
        status,
        errorCode,
    );
}
