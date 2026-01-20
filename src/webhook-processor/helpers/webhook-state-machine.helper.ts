import { WebhookEvent } from '../enums/webhook-event.enum';

export interface WebhookValidationResult {
  canProcess: boolean;
  reason?: string;
  currentEvent?: string;
  attemptedEvent: string;
}

interface StateConfig {
  allowedPrevious: string[];
  isTerminal: boolean;
}

const STATE_MACHINE: Record<string, StateConfig> = {
  [WebhookEvent.PIX_CASH_IN_WAS_RECEIVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.PIX_CASH_IN_WAS_CLEARED]: {
    allowedPrevious: [WebhookEvent.PIX_CASH_IN_WAS_RECEIVED],
    isTerminal: true,
  },

  [WebhookEvent.PIX_CASHOUT_WAS_COMPLETED]: {
    allowedPrevious: [],
    isTerminal: true,
  },
  [WebhookEvent.PIX_CASHOUT_WAS_CANCELED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.PIX_CASHOUT_WAS_UNDONE]: {
    allowedPrevious: [WebhookEvent.PIX_CASHOUT_WAS_CANCELED],
    isTerminal: true,
  },

  [WebhookEvent.PIX_REFUND_WAS_RECEIVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.PIX_REFUND_WAS_CLEARED]: {
    allowedPrevious: [WebhookEvent.PIX_REFUND_WAS_RECEIVED],
    isTerminal: true,
  },

  [WebhookEvent.PIX_QRCODE_WAS_CREATED]: {
    allowedPrevious: [],
    isTerminal: true,
  },

  [WebhookEvent.BOLETO_WAS_REGISTERED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED]: {
    allowedPrevious: [WebhookEvent.BOLETO_WAS_REGISTERED],
    isTerminal: false,
  },
  [WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED]: {
    allowedPrevious: [WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED],
    isTerminal: true,
  },
  [WebhookEvent.BOLETO_WAS_CANCELLED]: {
    allowedPrevious: [
      WebhookEvent.BOLETO_WAS_REGISTERED,
      WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
    ],
    isTerminal: true,
  },

  [WebhookEvent.BILL_PAYMENT_WAS_RECEIVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.BILL_PAYMENT_WAS_CREATED]: {
    allowedPrevious: [WebhookEvent.BILL_PAYMENT_WAS_RECEIVED],
    isTerminal: false,
  },
  [WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED]: {
    allowedPrevious: [WebhookEvent.BILL_PAYMENT_WAS_CREATED],
    isTerminal: false,
  },
  [WebhookEvent.BILL_PAYMENT_HAS_FAILED]: {
    allowedPrevious: [
      WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,
      WebhookEvent.BILL_PAYMENT_WAS_CREATED,
    ],
    isTerminal: false,
  },
  [WebhookEvent.BILL_PAYMENT_WAS_CANCELLED]: {
    allowedPrevious: [WebhookEvent.BILL_PAYMENT_HAS_FAILED],
    isTerminal: true,
  },
  [WebhookEvent.BILL_PAYMENT_WAS_REFUSED]: {
    allowedPrevious: [WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED],
    isTerminal: true,
  },

  // TED Cash-Out
  [WebhookEvent.TED_CASH_OUT_WAS_APPROVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.TED_CASH_OUT_WAS_DONE]: {
    allowedPrevious: [WebhookEvent.TED_CASH_OUT_WAS_APPROVED],
    isTerminal: true,
  },
  [WebhookEvent.TED_CASH_OUT_WAS_CANCELED]: {
    allowedPrevious: [WebhookEvent.TED_CASH_OUT_WAS_APPROVED],
    isTerminal: false,
  },
  [WebhookEvent.TED_CASH_OUT_WAS_REPROVED]: {
    allowedPrevious: [],
    isTerminal: true,
  },
  [WebhookEvent.TED_CASH_OUT_WAS_UNDONE]: {
    allowedPrevious: [WebhookEvent.TED_CASH_OUT_WAS_CANCELED],
    isTerminal: true,
  },

  // TED Cash-In
  [WebhookEvent.TED_CASH_IN_WAS_RECEIVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.TED_CASH_IN_WAS_CLEARED]: {
    allowedPrevious: [WebhookEvent.TED_CASH_IN_WAS_RECEIVED],
    isTerminal: true,
  },

  // TED Refund
  [WebhookEvent.TED_REFUND_WAS_RECEIVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.TED_REFUND_WAS_CLEARED]: {
    allowedPrevious: [WebhookEvent.TED_REFUND_WAS_RECEIVED],
    isTerminal: true,
  },
};

const TERMINAL_EVENTS = new Set<string>([
  WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
  WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,
  WebhookEvent.PIX_CASHOUT_WAS_UNDONE,
  WebhookEvent.PIX_REFUND_WAS_CLEARED,
  WebhookEvent.PIX_QRCODE_WAS_CREATED,
  WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,
  WebhookEvent.BOLETO_WAS_CANCELLED,
  WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
  WebhookEvent.BILL_PAYMENT_WAS_REFUSED,
  WebhookEvent.TED_CASH_OUT_WAS_DONE,
  WebhookEvent.TED_CASH_OUT_WAS_REPROVED,
  WebhookEvent.TED_CASH_OUT_WAS_UNDONE,
  WebhookEvent.TED_CASH_IN_WAS_CLEARED,
  WebhookEvent.TED_REFUND_WAS_CLEARED,
]);

/**
 * Verifica se um evento é terminal (final).
 * @param event - Nome do evento
 * @returns true se o evento é terminal
 */
export function isTerminalEvent(event: string): boolean {
  return TERMINAL_EVENTS.has(event);
}

/**
 * Valida se um webhook pode ser processado dado o estado atual.
 * @param currentEvent - Último evento processado (null se nenhum)
 * @param incomingEvent - Evento do webhook recebido
 * @returns Resultado da validação
 */
export function canProcessWebhook(
  currentEvent: string | null,
  incomingEvent: string,
): WebhookValidationResult {
  const stateConfig = STATE_MACHINE[incomingEvent];

  if (!stateConfig) {
    return {
      canProcess: true,
      attemptedEvent: incomingEvent,
      reason: 'Unknown event, allowing by default',
    };
  }

  if (!currentEvent) {
    const canBeInitial = stateConfig.allowedPrevious.length === 0;
    return {
      canProcess: canBeInitial,
      attemptedEvent: incomingEvent,
      reason: canBeInitial
        ? undefined
        : `Event ${incomingEvent} requires a previous state`,
    };
  }

  if (isTerminalEvent(currentEvent)) {
    return {
      canProcess: false,
      currentEvent,
      attemptedEvent: incomingEvent,
      reason: `Current state ${currentEvent} is terminal, cannot process ${incomingEvent}`,
    };
  }

  const isValidTransition = stateConfig.allowedPrevious.includes(currentEvent);

  return {
    canProcess: isValidTransition,
    currentEvent,
    attemptedEvent: incomingEvent,
    reason: isValidTransition
      ? undefined
      : `Invalid transition from ${currentEvent} to ${incomingEvent}`,
  };
}

/**
 * Retorna os eventos terminais para um fluxo específico.
 * @param flowPrefix - Prefixo do fluxo (ex: 'PIX_CASH_IN', 'BOLETO')
 * @returns Array de eventos terminais para o fluxo
 */
export function getTerminalEventsForFlow(flowPrefix: string): string[] {
  return Array.from(TERMINAL_EVENTS).filter((event) =>
    event.startsWith(flowPrefix),
  );
}
