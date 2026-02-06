# Playbook: Novo Provedor

Checklist para adicionar um novo provedor sem alterar o dominio.

## 1) Criar adapters do provedor
1. Criar pasta: `src/financial-providers/providers/<provider>/`
2. Implementar contratos por capacidade:
   - `AuthProvider`
   - `PixProvider`, `BoletoProvider`, `TedProvider`, `BillPaymentProvider`
   - `WebhookProvider` (gestao)
3. Implementar normalizers de webhook:
   - `PixWebhookNormalizer`
   - `BoletoWebhookNormalizer`
   - `TedWebhookNormalizer`
   - `BillPaymentWebhookNormalizer`

## 2) Registrar no Nest (DI)
1. Adicionar providers no modulo:
   - `FinancialProvidersModule` (auth e adapters)
   - `WebhookProcessorModule` (normalizers)
2. Incluir no registry correto:
   - `AuthProviderRegistry`
   - `PixProviderRegistry`, `BoletoProviderRegistry`, etc.
   - `PixWebhookNormalizerRegistry`, etc.

## 3) Configuracao e secrets
1. Adicionar variaveis de ambiente no `.env` ou Vault.
2. Documentar no `docs/SECRETS.md` (se existir).

## 4) Testes minimos
1. Testes de contrato por capacidade (mock do provider HTTP).
2. Teste de registry (provider nao registrado).
3. Teste de guard `:provider` vs sessao.

## 5) Verificacao operacional
1. Logs estruturados com provider e correlationId.
2. Métricas: latencia e taxa de erro por provider.
3. Observacao de webhooks e retries.
