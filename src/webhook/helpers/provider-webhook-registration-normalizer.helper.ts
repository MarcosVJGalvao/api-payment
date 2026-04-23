import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { RegisterWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { ProviderWebhookRegistrationResult } from '../interfaces/provider-webhook-registration-result.interface';

@Injectable()
export class ProviderWebhookRegistrationNormalizerHelper {
  normalize(
    provider: FinancialProvider,
    response: RegisterWebhookResponse,
  ): ProviderWebhookRegistrationResult {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return {
          providerWebhookId: response.id,
          providerPublicKey: response.publicKey,
          providerName: response.name,
          providerMetadata: {
            context: response.context,
            eventName: response.eventName,
            uri: response.uri,
          },
          providerRawResponse: {
            id: response.id,
            name: response.name,
            context: response.context,
            eventName: response.eventName,
            uri: response.uri,
            publicKey: response.publicKey,
          },
        };
      default:
        return {
          providerWebhookId: response.id,
          providerPublicKey: response.publicKey,
        };
    }
  }
}
