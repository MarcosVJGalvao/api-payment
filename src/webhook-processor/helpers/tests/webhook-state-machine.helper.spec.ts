import {
  canProcessWebhook,
  isTerminalEvent,
  getTerminalEventsForFlow,
} from '../webhook-state-machine.helper';
import { WebhookEvent } from '../../enums/webhook-event.enum';

describe('WebhookStateMachineHelper', () => {
  describe('isTerminalEvent', () => {
    it('should return true for terminal PIX events', () => {
      expect(isTerminalEvent(WebhookEvent.PIX_CASH_IN_WAS_CLEARED)).toBe(true);
      expect(isTerminalEvent(WebhookEvent.PIX_CASHOUT_WAS_COMPLETED)).toBe(
        true,
      );
      expect(isTerminalEvent(WebhookEvent.PIX_CASHOUT_WAS_UNDONE)).toBe(true);
      expect(isTerminalEvent(WebhookEvent.PIX_REFUND_WAS_CLEARED)).toBe(true);
    });

    it('should return false for non-terminal PIX events', () => {
      expect(isTerminalEvent(WebhookEvent.PIX_CASH_IN_WAS_RECEIVED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.PIX_CASHOUT_WAS_CANCELED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.PIX_REFUND_WAS_RECEIVED)).toBe(false);
    });

    it('should return true for terminal Boleto events', () => {
      expect(isTerminalEvent(WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED)).toBe(
        true,
      );
      expect(isTerminalEvent(WebhookEvent.BOLETO_WAS_CANCELLED)).toBe(true);
    });

    it('should return false for non-terminal Boleto events', () => {
      expect(isTerminalEvent(WebhookEvent.BOLETO_WAS_REGISTERED)).toBe(false);
      expect(isTerminalEvent(WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED)).toBe(
        false,
      );
    });

    it('should return true for terminal Bill Payment events', () => {
      expect(isTerminalEvent(WebhookEvent.BILL_PAYMENT_WAS_CANCELLED)).toBe(
        true,
      );
      expect(isTerminalEvent(WebhookEvent.BILL_PAYMENT_WAS_REFUSED)).toBe(true);
    });

    it('should return false for non-terminal Bill Payment events', () => {
      expect(isTerminalEvent(WebhookEvent.BILL_PAYMENT_WAS_RECEIVED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.BILL_PAYMENT_WAS_CREATED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.BILL_PAYMENT_HAS_FAILED)).toBe(false);
    });

    it('should return true for terminal TED events', () => {
      expect(isTerminalEvent(WebhookEvent.TED_CASH_OUT_WAS_DONE)).toBe(true);
      expect(isTerminalEvent(WebhookEvent.TED_CASH_OUT_WAS_REPROVED)).toBe(
        true,
      );
      expect(isTerminalEvent(WebhookEvent.TED_CASH_OUT_WAS_UNDONE)).toBe(true);
      expect(isTerminalEvent(WebhookEvent.TED_CASH_IN_WAS_CLEARED)).toBe(true);
      expect(isTerminalEvent(WebhookEvent.TED_REFUND_WAS_CLEARED)).toBe(true);
    });

    it('should return false for non-terminal TED events', () => {
      expect(isTerminalEvent(WebhookEvent.TED_CASH_OUT_WAS_APPROVED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.TED_CASH_OUT_WAS_CANCELED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.TED_CASH_IN_WAS_RECEIVED)).toBe(
        false,
      );
      expect(isTerminalEvent(WebhookEvent.TED_REFUND_WAS_RECEIVED)).toBe(false);
    });
  });

  describe('canProcessWebhook', () => {
    describe('PIX Cash-In flow', () => {
      it('should allow RECEIVED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow CLEARED after RECEIVED', () => {
        const result = canProcessWebhook(
          WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
          WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should reject CLEARED without prior RECEIVED', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
        );
        expect(result.canProcess).toBe(false);
        expect(result.reason).toContain('requires a previous state');
      });

      it('should reject any event after CLEARED (terminal)', () => {
        const result = canProcessWebhook(
          WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
          WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
        );
        expect(result.canProcess).toBe(false);
        expect(result.reason).toContain('terminal');
      });
    });

    describe('PIX Cash-Out flow', () => {
      it('should allow COMPLETED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow CANCELED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.PIX_CASHOUT_WAS_CANCELED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow UNDONE after CANCELED', () => {
        const result = canProcessWebhook(
          WebhookEvent.PIX_CASHOUT_WAS_CANCELED,
          WebhookEvent.PIX_CASHOUT_WAS_UNDONE,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should reject UNDONE without prior CANCELED', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.PIX_CASHOUT_WAS_UNDONE,
        );
        expect(result.canProcess).toBe(false);
      });

      it('should reject any event after COMPLETED (terminal)', () => {
        const result = canProcessWebhook(
          WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,
          WebhookEvent.PIX_CASHOUT_WAS_CANCELED,
        );
        expect(result.canProcess).toBe(false);
        expect(result.reason).toContain('terminal');
      });
    });

    describe('Boleto flow', () => {
      it('should allow REGISTERED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.BOLETO_WAS_REGISTERED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow CASH_IN_RECEIVED after REGISTERED', () => {
        const result = canProcessWebhook(
          WebhookEvent.BOLETO_WAS_REGISTERED,
          WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow CASH_IN_CLEARED after CASH_IN_RECEIVED', () => {
        const result = canProcessWebhook(
          WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
          WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow CANCELLED after REGISTERED', () => {
        const result = canProcessWebhook(
          WebhookEvent.BOLETO_WAS_REGISTERED,
          WebhookEvent.BOLETO_WAS_CANCELLED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should reject CASH_IN_RECEIVED after CLEARED (terminal)', () => {
        const result = canProcessWebhook(
          WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,
          WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
        );
        expect(result.canProcess).toBe(false);
        expect(result.reason).toContain('terminal');
      });
    });

    describe('Bill Payment flow', () => {
      it('should allow RECEIVED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow proper sequence: RECEIVED -> CREATED -> CONFIRMED', () => {
        let result = canProcessWebhook(
          WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,
          WebhookEvent.BILL_PAYMENT_WAS_CREATED,
        );
        expect(result.canProcess).toBe(true);

        result = canProcessWebhook(
          WebhookEvent.BILL_PAYMENT_WAS_CREATED,
          WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should reject CANCELLED without prior FAILED', () => {
        const result = canProcessWebhook(
          WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,
          WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
        );
        expect(result.canProcess).toBe(false);
      });

      it('should allow CANCELLED after FAILED', () => {
        const result = canProcessWebhook(
          WebhookEvent.BILL_PAYMENT_HAS_FAILED,
          WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
        );
        expect(result.canProcess).toBe(true);
      });
    });

    describe('TED Cash-Out flow', () => {
      it('should allow APPROVED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.TED_CASH_OUT_WAS_APPROVED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow DONE after APPROVED', () => {
        const result = canProcessWebhook(
          WebhookEvent.TED_CASH_OUT_WAS_APPROVED,
          WebhookEvent.TED_CASH_OUT_WAS_DONE,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should reject DONE without prior APPROVED', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.TED_CASH_OUT_WAS_DONE,
        );
        expect(result.canProcess).toBe(false);
      });

      it('should allow CANCELED after APPROVED', () => {
        const result = canProcessWebhook(
          WebhookEvent.TED_CASH_OUT_WAS_APPROVED,
          WebhookEvent.TED_CASH_OUT_WAS_CANCELED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow REPROVED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.TED_CASH_OUT_WAS_REPROVED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow UNDONE after CANCELED', () => {
        const result = canProcessWebhook(
          WebhookEvent.TED_CASH_OUT_WAS_CANCELED,
          WebhookEvent.TED_CASH_OUT_WAS_UNDONE,
        );
        expect(result.canProcess).toBe(true);
      });
    });

    describe('TED Cash-In flow', () => {
      it('should allow RECEIVED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.TED_CASH_IN_WAS_RECEIVED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow CLEARED after RECEIVED', () => {
        const result = canProcessWebhook(
          WebhookEvent.TED_CASH_IN_WAS_RECEIVED,
          WebhookEvent.TED_CASH_IN_WAS_CLEARED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should reject CLEARED without prior RECEIVED', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.TED_CASH_IN_WAS_CLEARED,
        );
        expect(result.canProcess).toBe(false);
      });
    });

    describe('TED Refund flow', () => {
      it('should allow RECEIVED as initial event', () => {
        const result = canProcessWebhook(
          null,
          WebhookEvent.TED_REFUND_WAS_RECEIVED,
        );
        expect(result.canProcess).toBe(true);
      });

      it('should allow CLEARED after RECEIVED', () => {
        const result = canProcessWebhook(
          WebhookEvent.TED_REFUND_WAS_RECEIVED,
          WebhookEvent.TED_REFUND_WAS_CLEARED,
        );
        expect(result.canProcess).toBe(true);
      });
    });

    describe('Unknown events', () => {
      it('should allow unknown events by default', () => {
        const result = canProcessWebhook(null, 'UNKNOWN_EVENT');
        expect(result.canProcess).toBe(true);
        expect(result.reason).toContain('Unknown event');
      });
    });
  });

  describe('getTerminalEventsForFlow', () => {
    it('should return PIX terminal events', () => {
      const events = getTerminalEventsForFlow('PIX');
      expect(events).toContain(WebhookEvent.PIX_CASH_IN_WAS_CLEARED);
      expect(events).toContain(WebhookEvent.PIX_CASHOUT_WAS_COMPLETED);
      expect(events).toContain(WebhookEvent.PIX_REFUND_WAS_CLEARED);
    });

    it('should return Boleto terminal events', () => {
      const events = getTerminalEventsForFlow('BOLETO');
      expect(events).toContain(WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED);
      expect(events).toContain(WebhookEvent.BOLETO_WAS_CANCELLED);
    });

    it('should return Bill Payment terminal events', () => {
      const events = getTerminalEventsForFlow('BILL_PAYMENT');
      expect(events).toContain(WebhookEvent.BILL_PAYMENT_WAS_CANCELLED);
      expect(events).toContain(WebhookEvent.BILL_PAYMENT_WAS_REFUSED);
    });
  });
});
