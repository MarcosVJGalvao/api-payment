import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { TedWebhookNormalizer } from '@/webhook-processor/contracts/ted-webhook-normalizer';
import { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import {
  TedCashOutData,
  TedCashInData,
  TedRefundData,
} from '@/webhook-processor/interfaces/ted-webhook.interface';

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function getNested(obj: unknown, key: string): unknown {
  if (!isRecord(obj)) return undefined;
  return obj[key];
}

function normalizeParticipant(
  raw: unknown,
): TedCashOutData['sender'] | TedCashOutData['recipient'] | undefined {
  if (!isRecord(raw)) return undefined;

  const document = getNested(raw, 'document');
  const account = getNested(raw, 'account');
  const bank = getNested(account, 'bank');

  const documentValue = getString(getNested(document, 'value'));
  const name = getString(getNested(raw, 'name'));

  const branch = getString(getNested(account, 'branch'));
  const number = getString(getNested(account, 'number'));
  const accountType = getString(getNested(account, 'type'));

  const bankIspb = getString(getNested(bank, 'ispb'));
  const bankCompe =
    getString(getNested(bank, 'code')) ?? getString(getNested(bank, 'compe'));
  const bankName = getString(getNested(bank, 'name'));

  if (!documentValue && !name && !branch && !number && !bankIspb) {
    return undefined;
  }

  const normalizedAccount: NonNullable<TedCashOutData['sender']>['account'] = {
    branch: branch || '',
    number: number || '',
    bank: {
      ispb: bankIspb || '',
      name: bankName || '',
      compe: bankCompe || '',
    },
    ...(accountType ? { type: accountType } : {}),
  };

  return {
    document: documentValue || '',
    name,
    account: normalizedAccount,
  };
}

function normalizeTedCashOutData(
  raw: unknown,
  fallbackAuthCode?: string,
): TedCashOutData {
  const authenticationCode =
    getString(getNested(raw, 'authenticationCode')) || fallbackAuthCode || '';

  const amount = getNested(raw, 'amount');
  const amountValue =
    getNumber(getNested(amount, 'value')) ?? Number(getNested(amount, 'value'));
  const amountCurrency = getString(getNested(amount, 'currency')) || 'BRL';

  const channel = getNested(raw, 'channel');
  const channelName = getString(getNested(channel, 'name'));
  const channelRecipient = getNested(channel, 'recipient');

  const sender = normalizeParticipant(getNested(raw, 'sender'));
  const recipient = normalizeParticipant(channelRecipient);

  return {
    authenticationCode,
    amount: {
      value: Number.isFinite(amountValue) ? Number(amountValue) : 0,
      currency: amountCurrency,
    },
    description: getString(getNested(raw, 'description')),
    status: getString(getNested(raw, 'status')) || '',
    channel: channelName,
    paymentDate: getString(getNested(raw, 'paymentDate')),
    refusalReason: getString(getNested(raw, 'refusalReason')),
    sender,
    recipient,
    createdAt: getString(getNested(raw, 'createdAt')),
    updatedAt: getString(getNested(raw, 'updatedAt')),
  };
}

function normalizeTedCashInData(
  raw: unknown,
  fallbackAuthCode?: string,
): TedCashInData {
  const authenticationCode =
    getString(getNested(raw, 'authenticationCode')) || fallbackAuthCode || '';

  const amount = getNested(raw, 'amount');
  const amountValue =
    getNumber(getNested(amount, 'value')) ?? Number(getNested(amount, 'value'));
  const amountCurrency = getString(getNested(amount, 'currency')) || 'BRL';

  const channel = getNested(raw, 'channel');
  const channelName = getString(getNested(channel, 'name'));

  const sender = normalizeParticipant(getNested(raw, 'sender'));
  // Alguns payloads do Hiperbanco trazem o recipient dentro de `channel.recipient`.
  const recipient =
    normalizeParticipant(getNested(raw, 'recipient')) ||
    normalizeParticipant(getNested(channel, 'recipient'));

  return {
    authenticationCode,
    amount: {
      value: Number.isFinite(amountValue) ? Number(amountValue) : 0,
      currency: amountCurrency,
    },
    description: getString(getNested(raw, 'description')),
    channel: channelName,
    sender,
    recipient,
    createdAt: getString(getNested(raw, 'createdAt')),
  };
}

function normalizeTedRefundData(
  raw: unknown,
  fallbackAuthCode?: string,
): TedRefundData {
  const authenticationCode =
    getString(getNested(raw, 'authenticationCode')) || fallbackAuthCode || '';

  const amount = getNested(raw, 'amount');
  const amountValue =
    getNumber(getNested(amount, 'value')) ?? Number(getNested(amount, 'value'));
  const amountCurrency = getString(getNested(amount, 'currency')) || 'BRL';

  const sender = normalizeParticipant(getNested(raw, 'sender'));
  const recipient = normalizeParticipant(getNested(raw, 'recipient'));

  return {
    authenticationCode,
    originalAuthenticationCode: getString(
      getNested(raw, 'originalAuthenticationCode'),
    ),
    amount: {
      value: Number.isFinite(amountValue) ? Number(amountValue) : 0,
      currency: amountCurrency,
    },
    description: getString(getNested(raw, 'description')),
    refundReason: getString(getNested(raw, 'refundReason')),
    errorCode: getString(getNested(raw, 'errorCode')),
    errorReason: getString(getNested(raw, 'errorReason')),
    sender,
    recipient,
    createdAt: getString(getNested(raw, 'createdAt')),
  };
}

function normalizeEvents<T>(
  events: WebhookPayload<unknown>[],
  normalizer: (raw: unknown, fallbackAuthCode?: string) => T,
): WebhookPayload<T>[] {
  return events.map((event) => ({
    ...event,
    data: normalizer(event.data, event.entityId || event.correlationId),
  })) as WebhookPayload<T>[];
}

@Injectable()
export class HiperbancoTedWebhookNormalizer implements TedWebhookNormalizer {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  normalizeCashOutApproved(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedCashOutData,
    );
  }

  normalizeCashOutDone(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedCashOutData,
    );
  }

  normalizeCashOutCanceled(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedCashOutData,
    );
  }

  normalizeCashOutReproved(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedCashOutData,
    );
  }

  normalizeCashOutUndone(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedCashOutData,
    );
  }

  normalizeCashInReceived(
    events: WebhookPayload<TedCashInData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashInData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedCashInData,
    );
  }

  normalizeCashInCleared(
    events: WebhookPayload<TedCashInData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashInData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedCashInData,
    );
  }

  normalizeRefundReceived(
    events: WebhookPayload<TedRefundData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedRefundData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedRefundData,
    );
  }

  normalizeRefundCleared(
    events: WebhookPayload<TedRefundData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedRefundData>[] {
    return normalizeEvents(
      events as unknown as WebhookPayload<unknown>[],
      normalizeTedRefundData,
    );
  }
}
