import { Injectable, Logger } from '@nestjs/common';
import { OutboundWebhookDispatchService } from '../services/outbound-webhook-dispatch.service';
import type { DispatchTriggerInput } from '../interfaces/dispatch-trigger-input.interface';
import { getErrorMessage } from '@/common/helpers/exception.helper';

@Injectable()
export class OutboundWebhookDispatchTrigger {
  private readonly logger = new Logger(OutboundWebhookDispatchTrigger.name);

  constructor(
    private readonly dispatchService: OutboundWebhookDispatchService,
  ) {}

  /**
   * Agenda o despacho de webhook para o cliente após processamento interno bem-sucedido.
   * Nunca propaga erros — o fluxo de processamento inbound não deve ser afetado.
   */
  async schedule(input: DispatchTriggerInput): Promise<void> {
    try {
      await this.dispatchService.dispatch(input);
    } catch (error) {
      this.logger.error(
        `OutboundWebhookDispatchTrigger: failed to dispatch event ${input.providerEventName} for client ${input.clientId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
