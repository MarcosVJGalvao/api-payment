import { AccountStatus, AccountType } from '@/account/entities/account.entity';

/**
 * Converte um status string para AccountStatus enum de forma segura.
 * Se o status não for válido, retorna AccountStatus.ACTIVE como padrão.
 * @param status - Status recebido da API externa (pode ser string)
 * @returns AccountStatus válido
 */
export function parseAccountStatus(status: string): AccountStatus {
  const validStatuses = Object.values(AccountStatus);
  const matchedStatus = validStatuses.find((s) => s === status);
  return matchedStatus ?? AccountStatus.ACTIVE;
}

/**
 * Converte um type string para AccountType enum de forma segura.
 * Se o type não for válido, retorna AccountType.MAIN como padrão.
 * @param type - Type recebido da API externa (pode ser string)
 * @returns AccountType válido
 */
export function parseAccountType(type: string): AccountType {
  const validTypes = Object.values(AccountType);
  const matchedType = validTypes.find((t) => t === type);
  return matchedType ?? AccountType.MAIN;
}
