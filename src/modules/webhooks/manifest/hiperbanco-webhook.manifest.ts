import { WebhookContext } from '@/webhook/enums/webhook-context.enum';
import { WebhookEvent } from '@/webhook-processor/enums/webhook-event.enum';

export interface HiperbancoWebhookManifestEntry {
  eventName: WebhookEvent;
  context: WebhookContext;
  /** Caminho relativo; API_PAYMENT_PUBLIC_URL é prefixado em runtime */
  callbackPath: string;
}

export const HIPERBANCO_WEBHOOK_MANIFEST: HiperbancoWebhookManifestEntry[] = [
  {
    eventName: WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/cash-in/received',
  },
  {
    eventName: WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/cash-in/cleared',
  },
  {
    eventName: WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/cash-out/completed',
  },
  {
    eventName: WebhookEvent.PIX_CASHOUT_WAS_CANCELED,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/cash-out/canceled',
  },
  {
    eventName: WebhookEvent.PIX_CASHOUT_WAS_UNDONE,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/cash-out/undone',
  },
  {
    eventName: WebhookEvent.PIX_REFUND_WAS_RECEIVED,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/refund/received',
  },
  {
    eventName: WebhookEvent.PIX_REFUND_WAS_CLEARED,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/refund/cleared',
  },
  {
    eventName: WebhookEvent.PIX_QRCODE_WAS_CREATED,
    context: WebhookContext.PIX,
    callbackPath: '/webhook/hiperbanco/pix/qrcode/created',
  },
  {
    eventName: WebhookEvent.BOLETO_WAS_REGISTERED,
    context: WebhookContext.BOLETO,
    callbackPath: '/webhook/hiperbanco/boleto/registered',
  },
  {
    eventName: WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
    context: WebhookContext.BOLETO,
    callbackPath: '/webhook/hiperbanco/boleto/cash-in/received',
  },
  {
    eventName: WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,
    context: WebhookContext.BOLETO,
    callbackPath: '/webhook/hiperbanco/boleto/cash-in/cleared',
  },
  {
    eventName: WebhookEvent.BOLETO_WAS_CANCELLED,
    context: WebhookContext.BOLETO,
    callbackPath: '/webhook/hiperbanco/boleto/cancelled',
  },
  {
    eventName: WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,
    context: WebhookContext.PAYMENT,
    callbackPath: '/webhook/hiperbanco/bill-payment/received',
  },
  {
    eventName: WebhookEvent.BILL_PAYMENT_WAS_CREATED,
    context: WebhookContext.PAYMENT,
    callbackPath: '/webhook/hiperbanco/bill-payment/created',
  },
  {
    eventName: WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,
    context: WebhookContext.PAYMENT,
    callbackPath: '/webhook/hiperbanco/bill-payment/confirmed',
  },
  {
    eventName: WebhookEvent.BILL_PAYMENT_HAS_FAILED,
    context: WebhookContext.PAYMENT,
    callbackPath: '/webhook/hiperbanco/bill-payment/failed',
  },
  {
    eventName: WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
    context: WebhookContext.PAYMENT,
    callbackPath: '/webhook/hiperbanco/bill-payment/cancelled',
  },
  {
    eventName: WebhookEvent.BILL_PAYMENT_WAS_REFUSED,
    context: WebhookContext.PAYMENT,
    callbackPath: '/webhook/hiperbanco/bill-payment/refused',
  },
  {
    eventName: WebhookEvent.TED_CASH_OUT_WAS_APPROVED,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/cash-out/approved',
  },
  {
    eventName: WebhookEvent.TED_CASH_OUT_WAS_DONE,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/cash-out/done',
  },
  {
    eventName: WebhookEvent.TED_CASH_OUT_WAS_CANCELED,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/cash-out/canceled',
  },
  {
    eventName: WebhookEvent.TED_CASH_OUT_WAS_REPROVED,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/cash-out/reproved',
  },
  {
    eventName: WebhookEvent.TED_CASH_OUT_WAS_UNDONE,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/cash-out/undone',
  },
  {
    eventName: WebhookEvent.TED_CASH_IN_WAS_RECEIVED,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/cash-in/received',
  },
  {
    eventName: WebhookEvent.TED_CASH_IN_WAS_CLEARED,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/cash-in/cleared',
  },
  {
    eventName: WebhookEvent.TED_REFUND_WAS_RECEIVED,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/refund/received',
  },
  {
    eventName: WebhookEvent.TED_REFUND_WAS_CLEARED,
    context: WebhookContext.TED,
    callbackPath: '/webhook/hiperbanco/ted/refund/cleared',
  },
];
