import { WebhookEvent } from '../enums/webhook-event.enum';

/**
 * Resultado da validação de sequência de webhook.
 */
export interface WebhookValidationResult {
  /** Se o webhook pode ser processado */
  canProcess: boolean;
  /** Motivo se não puder processar */
  reason?: string;
  /** Status/evento atual da entidade */
  currentEvent?: string;
  /** Evento que está sendo tentado */
  attemptedEvent: string;
}

/**
 * Configuração de transição de estado para cada evento.
 */
interface StateConfig {
  /** Eventos anteriores permitidos (vazio = evento inicial) */
  allowedPrevious: string[];
  /** Se este evento é um estado terminal (final) */
  isTerminal: boolean;
}

/**
 * Máquina de estados para webhooks.
 * Define quais transições são válidas para cada tipo de operação.
 */
const STATE_MACHINE: Record<string, StateConfig> = {
  // PIX Cash-In
  [WebhookEvent.PIX_CASH_IN_WAS_RECEIVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.PIX_CASH_IN_WAS_CLEARED]: {
    allowedPrevious: [WebhookEvent.PIX_CASH_IN_WAS_RECEIVED],
    isTerminal: true,
  },

  // PIX Cash-Out
  [WebhookEvent.PIX_CASHOUT_WAS_COMPLETED]: {
    allowedPrevious: [],
    isTerminal: true,
  },
  [WebhookEvent.PIX_CASHOUT_WAS_CANCELED]: {
    allowedPrevious: [],
    isTerminal: false, // Pode evoluir para UNDONE
  },
  [WebhookEvent.PIX_CASHOUT_WAS_UNDONE]: {
    allowedPrevious: [WebhookEvent.PIX_CASHOUT_WAS_CANCELED],
    isTerminal: true,
  },

  // PIX Refund
  [WebhookEvent.PIX_REFUND_WAS_RECEIVED]: {
    allowedPrevious: [],
    isTerminal: false,
  },
  [WebhookEvent.PIX_REFUND_WAS_CLEARED]: {
    allowedPrevious: [WebhookEvent.PIX_REFUND_WAS_RECEIVED],
    isTerminal: true,
  },

  // PIX QR Code
  [WebhookEvent.PIX_QRCODE_WAS_CREATED]: {
    allowedPrevious: [],
    isTerminal: true,
  },

  // Boleto
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

  // Bill Payment
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
    isTerminal: false, // Pode evoluir para REFUSED
  },
  [WebhookEvent.BILL_PAYMENT_HAS_FAILED]: {
    allowedPrevious: [
      WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,
      WebhookEvent.BILL_PAYMENT_WAS_CREATED,
    ],
    isTerminal: false, // Pode evoluir para CANCELLED
  },
  [WebhookEvent.BILL_PAYMENT_WAS_CANCELLED]: {
    allowedPrevious: [WebhookEvent.BILL_PAYMENT_HAS_FAILED],
    isTerminal: true,
  },
  [WebhookEvent.BILL_PAYMENT_WAS_REFUSED]: {
    allowedPrevious: [WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED],
    isTerminal: true,
  },
};

/**
 * Eventos terminais (finais) que não podem receber mais atualizações.
 */
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

  // Evento desconhecido - permitir por segurança
  if (!stateConfig) {
    return {
      canProcess: true,
      attemptedEvent: incomingEvent,
      reason: 'Unknown event, allowing by default',
    };
  }

  // Se não há evento anterior, verificar se este pode ser inicial
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

  // Se o estado atual é terminal, não aceitar mais webhooks
  if (isTerminalEvent(currentEvent)) {
    return {
      canProcess: false,
      currentEvent,
      attemptedEvent: incomingEvent,
      reason: `Current state ${currentEvent} is terminal, cannot process ${incomingEvent}`,
    };
  }

  // Verificar se a transição é válida
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
