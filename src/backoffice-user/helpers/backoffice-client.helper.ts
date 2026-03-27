import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AuthorizedRequest } from '@/common/interfaces/authorized-request.interface';

/**
 * Extrai o clientId do JWT (Backoffice) ou do body/query (Interno) -
 * Usar em rotas onde o clientId não é obrigatório.
 * @param req Objeto de request do Express
 * @returns clientId resolvido ou undefined(Irá exibir todos os dados independente do clientId)
 */
export function resolveClientId(req: AuthorizedRequest): string | undefined {
  if (req.user?.clientId) {
    return req.user.clientId;
  }

  if (req.body?.clientId) {
    return req.body.clientId;
  }

  if (typeof req.query?.clientId === 'string') {
    return req.query.clientId;
  }

  return undefined;
}

/**
 * Garante que o clientId esteja presente na requisição -
 * Usar em rotas onde o clientId é obrigatório.
 * @param req Objeto de request do Express
 * @returns clientId resolvido (irá exibir / criar dados do cliente informado)
 * @throws CustomHttpException se o clientId não for encontrado
 */
export function requireClientId(req: AuthorizedRequest): string {
  const clientId = resolveClientId(req);

  if (!clientId) {
    throw new CustomHttpException(
      'Client ID is required.',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT,
    );
  }

  return clientId;
}
