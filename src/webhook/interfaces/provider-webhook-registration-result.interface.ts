export interface ProviderWebhookRegistrationResult {
  providerWebhookId: string;
  providerPublicKey?: string | null;
  providerName?: string | null;
  providerMetadata?: Record<string, unknown>;
  providerRawResponse?: Record<string, unknown>;
}
