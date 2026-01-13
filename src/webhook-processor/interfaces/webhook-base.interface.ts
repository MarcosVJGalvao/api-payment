/**
 * Interface base para todos os payloads de webhook.
 */
export interface WebhookPayload<T = unknown> {
  entityId: string;
  companyKey: string;
  idempotencyKey: string;
  context: 'Pix' | 'Boleto' | 'Payment';
  name: string;
  timestamp: string;
  correlationId: string;
  version?: string;
  metadata?: Record<string, unknown>;
  data: T;
}

/**
 * Interface para dados de valor monetário.
 */
export interface AmountData {
  value: number;
  currency: string;
}

/**
 * Interface para dados de documento.
 */
export interface DocumentData {
  value: string;
  type: string;
}

/**
 * Interface para dados de conta bancária.
 */
export interface AccountData {
  branch: string;
  number: string;
  type?: string;
  bank?: {
    ispb: string;
    code?: string;
    name?: string;
  };
}

/**
 * Interface para dados de participante (sender/recipient).
 */
export interface ParticipantData {
  document: DocumentData;
  type?: string;
  name?: string;
  status?: string;
  account?: AccountData & { status?: string };
}
