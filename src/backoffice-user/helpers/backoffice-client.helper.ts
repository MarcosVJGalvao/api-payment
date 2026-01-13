import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AuthorizedRequest } from '@/common/interfaces/authorized-request.interface';

/**
 * Resolve o Client ID da requisição.
 * - Prioridade 1: Usuário Backoffice autenticado (JWT contém clientId).
 * - Prioridade 2: Usuário Interno (Body deve conter clientId).
 *
 * @param req Objeto de request do Express
 * @returns clientId resolvido
 * @throws CustomHttpException se não encontrar o clientId
 */
export function resolveClientId(req: AuthorizedRequest): string {
  // 1. If Backoffice User (JWT in req.user)
  if (req.user && req.user.clientId) {
    return req.user.clientId;
  }

  // 2. If Internal User (Admin) - Expect clientId in body
  if (req.body.clientId) {
    return req.body.clientId;
  }

  throw new CustomHttpException(
    'Client ID is missing',
    HttpStatus.BAD_REQUEST,
    ErrorCode.INVALID_INPUT,
  );
}
