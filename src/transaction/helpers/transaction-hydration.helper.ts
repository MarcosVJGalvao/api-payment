import { In } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { IHydrationRepositories } from '../interfaces/hydration-repositories.interface';

/**
 * Extrai IDs únicos de um campo específico das transações
 * @param transactions - Lista de transações
 * @param field - Campo a ser extraído
 * @returns Array de IDs únicos (sem undefined/null)
 */
function extractIds(
  transactions: Transaction[],
  field: keyof Transaction,
): string[] {
  const ids = transactions
    .map((transaction) => transaction[field])
    .filter(
      (value): value is string => typeof value === 'string' && value !== '',
    );
  return Array.from(new Set(ids));
}

/**
 * Cria um mapa de entidades por ID para lookup rápido
 * @param entities - Lista de entidades
 * @returns Map de ID para entidade
 */
function createEntityMap<T extends { id: string }>(
  entities: T[],
): Map<string, T> {
  return new Map(entities.map((entity) => [entity.id, entity]));
}

/**
 * Hidrata transações com suas relações em lote (multi-step loading).
 * Evita múltiplos JOINs pesados, buscando relações separadamente e
 * fazendo merge in-memory.
 *
 * @param transactions - Lista de transações a serem hidratadas
 * @param repositories - Repositórios das entidades relacionadas
 * @returns Transações hidratadas com relações populadas
 */
export async function hydrateTransactionRelations(
  transactions: Transaction[],
  repositories: IHydrationRepositories,
): Promise<Transaction[]> {
  if (transactions.length === 0) {
    return transactions;
  }

  const pixCashInIds = extractIds(transactions, 'pixCashInId');
  const pixTransferIds = extractIds(transactions, 'pixTransferId');
  const pixRefundIds = extractIds(transactions, 'pixRefundId');
  const pixQrCodeIds = extractIds(transactions, 'pixQrCodeId');
  const boletoIds = extractIds(transactions, 'boletoId');
  const billPaymentIds = extractIds(transactions, 'billPaymentId');
  const tedTransferIds = extractIds(transactions, 'tedTransferId');
  const tedCashInIds = extractIds(transactions, 'tedCashInId');
  const tedRefundIds = extractIds(transactions, 'tedRefundId');

  const [
    pixCashInData,
    pixTransferData,
    pixRefundData,
    pixQrCodeData,
    boletoData,
    billPaymentData,
    tedTransferData,
    tedCashInData,
    tedRefundData,
  ] = await Promise.all([
    pixCashInIds.length > 0
      ? repositories.pixCashIn.find({
          where: { id: In(pixCashInIds) },
          relations: ['sender', 'recipient'],
        })
      : [],
    pixTransferIds.length > 0
      ? repositories.pixTransfer.find({
          where: { id: In(pixTransferIds) },
          relations: ['sender', 'recipient'],
        })
      : [],
    pixRefundIds.length > 0
      ? repositories.pixRefund.find({
          where: { id: In(pixRefundIds) },
        })
      : [],
    pixQrCodeIds.length > 0
      ? repositories.pixQrCode.find({
          where: { id: In(pixQrCodeIds) },
        })
      : [],
    boletoIds.length > 0
      ? repositories.boleto.find({
          where: { id: In(boletoIds) },
          relations: ['payer'],
        })
      : [],
    billPaymentIds.length > 0
      ? repositories.billPayment.find({
          where: { id: In(billPaymentIds) },
          relations: ['recipient'],
        })
      : [],
    tedTransferIds.length > 0
      ? repositories.tedTransfer.find({
          where: { id: In(tedTransferIds) },
          relations: ['sender', 'recipient'],
        })
      : [],
    tedCashInIds.length > 0
      ? repositories.tedCashIn.find({
          where: { id: In(tedCashInIds) },
          relations: ['sender', 'recipient'],
        })
      : [],
    tedRefundIds.length > 0
      ? repositories.tedRefund.find({
          where: { id: In(tedRefundIds) },
        })
      : [],
  ]);

  const pixCashInMap = createEntityMap(pixCashInData);
  const pixTransferMap = createEntityMap(pixTransferData);
  const pixRefundMap = createEntityMap(pixRefundData);
  const pixQrCodeMap = createEntityMap(pixQrCodeData);
  const boletoMap = createEntityMap(boletoData);
  const billPaymentMap = createEntityMap(billPaymentData);
  const tedTransferMap = createEntityMap(tedTransferData);
  const tedCashInMap = createEntityMap(tedCashInData);
  const tedRefundMap = createEntityMap(tedRefundData);

  for (const transaction of transactions) {
    if (transaction.pixCashInId) {
      transaction.pixCashIn = pixCashInMap.get(transaction.pixCashInId);
    }
    if (transaction.pixTransferId) {
      transaction.pixTransfer = pixTransferMap.get(transaction.pixTransferId);
    }
    if (transaction.pixRefundId) {
      transaction.pixRefund = pixRefundMap.get(transaction.pixRefundId);
    }
    if (transaction.pixQrCodeId) {
      transaction.pixQrCode = pixQrCodeMap.get(transaction.pixQrCodeId);
    }
    if (transaction.boletoId) {
      transaction.boleto = boletoMap.get(transaction.boletoId);
    }
    if (transaction.billPaymentId) {
      transaction.billPayment = billPaymentMap.get(transaction.billPaymentId);
    }
    if (transaction.tedTransferId) {
      transaction.tedTransfer = tedTransferMap.get(transaction.tedTransferId);
    }
    if (transaction.tedCashInId) {
      transaction.tedCashIn = tedCashInMap.get(transaction.tedCashInId);
    }
    if (transaction.tedRefundId) {
      transaction.tedRefund = tedRefundMap.get(transaction.tedRefundId);
    }
  }

  return transactions;
}
