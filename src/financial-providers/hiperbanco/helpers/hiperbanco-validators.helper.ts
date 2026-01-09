import { HiperbancoErrorResponse } from '../interfaces/hiperbanco-responses.interface';

/**
 * Type Guard para verificar se a resposta de erro segue o formato esperado
 */
export function isHiperbancoErrorResponse(
  data: unknown,
): data is HiperbancoErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('message' in data || 'errorCode' in data)
  );
}
