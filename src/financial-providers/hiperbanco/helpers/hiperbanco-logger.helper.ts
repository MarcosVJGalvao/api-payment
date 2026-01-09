import { AppLoggerService } from '@/common/logger/logger.service';
import { sanitizePayload } from '@/common/helpers/object.helper';

/**
 * Registra detalhes de uma transação da API do Hiperbanco (requisição/resposta).
 *
 * @param logger Instância do logger a ser usada
 * @param context O contexto de log (ex: Nome do Service)
 * @param method Método HTTP
 * @param url URL da requisição
 * @param statusCode Código de status HTTP
 * @param durationMs Duração da requisição em milissegundos
 * @param requestHeaders Cabeçalhos enviados na requisição
 * @param requestBody Corpo enviado na requisição
 * @param responseBody Corpo recebido na resposta
 * @param error Mensagem de erro opcional
 * @param stack Stack trace opcional do erro
 */
export function logTransaction(
  logger: AppLoggerService,
  context: string,
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
      headers: sanitizePayload(requestHeaders),
      body: requestBody ? sanitizePayload(requestBody) : undefined,
    },
    response: responseBody ? sanitizePayload(responseBody) : undefined,
    duration: `${durationMs}ms`,
    provider: 'Hiperbanco',
    ...(error && { message: error }),
    ...(stack && { stack }),
  };

  const isError = statusCode >= 400 || !!error;
  const message = isError
    ? 'Hiperbanco Request Failed'
    : 'Hiperbanco Request Success';

  logger.logWithContext(isError ? 'error' : 'log', message, meta, context);
}
