# Plano: Camada de Abstração de Webhooks — api-payment

## Context

A `api-payment` recebe webhooks do Hiperbanco em endpoints por domínio (`/webhook/:provider/pix/cash-out/completed`, etc.) e processa internamente. Não existe hoje nenhum sistema de despacho de webhooks para clientes integradores. O objetivo é:

1. Declarar em código (manifesto) todos os webhooks que a API precisa receber do Hiperbanco e sincronizá-los automaticamente no startup.
2. Criar uma camada de despacho de webhooks padronizados para clientes (`WebhookConfiguration` + `WebhookMessage` + HMAC + circuit breaker + retry).
3. Conectar o fluxo existente ao novo despacho com uma modificação mínima e aditiva nos quatro processors existentes.

**Invariante crítica:** nenhuma lógica de negócio existente é alterada, removida ou substituída.

---

## Diagnóstico da Codebase

| Componente existente | Localização | Função |
|---|---|---|
| Recepção de webhooks do provider | `src/webhook-processor/controllers/` | 4 controllers, rotas por domínio (`/webhook/:provider/pix/...`) |
| Segurança inbound | `src/webhook-processor/guards/webhook-public-key.guard.ts` | Valida `publickey` header vs tabela `webhook` |
| Processadores de fila | `src/webhook-processor/processors/` | `PixWebhookProcessor`, `BoletoWebhookProcessor`, `TedWebhookProcessor`, `BillPaymentWebhookProcessor` |
| Serviços de regra de negócio | `src/webhook-processor/services/` | `PixWebhookService`, `BoletoWebhookService`, etc. — atualizam entidades internas |
| Idempotência | `enqueueWebhookEvent()` + `authenticationCode` | jobId do Bull = `idempotencyKey`; checks no service |
| Race condition | `webhook-state-machine.helper.ts` + retryable exceptions | State machine por tipo de evento |
| Auditoria | `webhook_event_log` table via `WebhookEventLogService` | Log de todos eventos processados |
| Retry | Queue catalog + Bull | 5 tentativas, exponential backoff 5s→10s→20s→40s→80s |
| Registro de webhooks (cliente → API) | `src/webhook/` | CRUD, processor de registro no Hiperbanco, `HiperbancoWebhookHelper` |
| HTTP client Hiperbanco | `src/financial-providers/hiperbanco/hiperbanco-http.service.ts` | wraps @nestjs/axios |
| Session Hiperbanco | `src/webhook/helpers/provider-session.helper.ts` | `executeWithRetry()` com refresh de token |
| Enums de eventos provider | `src/webhook-processor/enums/webhook-event.enum.ts` | 27 valores (`WebhookEvent`) |
| Enum de provider | `src/common/enums/financial-provider.enum.ts` | `HIPERBANCO = 'hiperbanco'` |
| Contextos de webhook | `src/webhook/enums/webhook-context.enum.ts` | PIX, BOLETO, TED, PAYMENT, etc. |

**O que NÃO existe hoje:** despacho de webhooks para clientes integradores — nenhuma entidade, serviço, fila ou endpoint para isso.

---

## O Que Será Construído

### Novo módulo: `src/modules/webhooks/`

```
src/modules/webhooks/
├── webhooks.module.ts
├── enums/
│   ├── api-payment-webhook-event-type.enum.ts        ← eventos internos padronizados (27 valores)
│   └── outbound-webhook-message-status.enum.ts       ← PENDING / DELIVERED / FAILED / CIRCUIT_OPEN
├── entities/
│   ├── webhook-configuration.entity.ts               ← config de webhook do cliente integrador
│   └── webhook-message.entity.ts                     ← rastreamento de cada tentativa de entrega
├── dto/
│   ├── create-webhook-configuration.dto.ts
│   ├── update-webhook-configuration.dto.ts
│   ├── query-webhook-configuration.dto.ts
│   ├── query-webhook-message.dto.ts
│   └── reprocess-webhook-messages.dto.ts
├── interfaces/
│   ├── outbound-webhook-payload.interface.ts         ← shape do payload array enviado ao cliente
│   ├── dispatch-trigger-input.interface.ts           ← o que os processors passam ao trigger
│   └── outbound-delivery-job.interface.ts            ← job do Bull para entrega
├── repositories/
│   ├── webhook-configuration.repository.ts
│   └── webhook-message.repository.ts
├── services/
│   ├── webhook-hmac-signing.service.ts               ← HMAC SHA-256 per spec
│   ├── webhook-configuration.service.ts              ← CRUD + enable/disable
│   ├── webhook-message.service.ts                    ← criar, consultar, reprocessar
│   ├── outbound-webhook-dispatch.service.ts          ← acha configs, cria messages, enfileira
│   └── provider-webhook-bootstrap.service.ts        ← OnApplicationBootstrap: sync manifesto → Hiperbanco
├── triggers/
│   └── outbound-webhook-dispatch.trigger.ts         ← injetável pelos processors, sem throw
├── processors/
│   └── outbound-webhook-delivery.processor.ts       ← @Processor('webhook-outbound-delivery')
├── manifest/
│   └── hiperbanco-webhook.manifest.ts               ← os 27 eventos + callbackPaths
├── maps/
│   └── provider-event-to-api-event.map.ts           ← WebhookEvent → ApiPaymentWebhookEventType
├── controllers/
│   ├── webhook-configuration.controller.ts
│   └── webhook-message.controller.ts
└── docs/                                            ← decorators Swagger (6 arquivos)
```

### Migrations novas

```
src/database/migrations/
├── 1769100000000-CreateWebhookConfigurationTable.ts
└── 1769200000000-CreateWebhookMessageTable.ts
```

---

## Arquivos Existentes a Modificar (mínimo e aditivo)

| Arquivo | Mudança |
|---|---|
| `src/app.module.ts` | Adicionar `WebhooksModule` ao array `imports` |
| `src/queue/policies/queue-policy.catalog.ts` | Adicionar entry `webhookOutboundDelivery` (queue `webhook-outbound-delivery`) |
| `src/common/errors/enums/error-code.enum.ts` | Adicionar 4 error codes novos |
| `src/webhook/webhook.module.ts` | Adicionar `ProviderSessionHelper` ao `exports` |
| `src/webhook-processor/webhook-processor.module.ts` | Importar `WebhooksModule`; adicionar `OutboundWebhookDispatchTrigger` a `providers` |
| `src/webhook-processor/processors/pix-webhook.processor.ts` | Injetar trigger, chamar após switch |
| `src/webhook-processor/processors/boleto-webhook.processor.ts` | Idem |
| `src/webhook-processor/processors/ted-webhook.processor.ts` | Idem |
| `src/webhook-processor/processors/bill-payment-webhook.processor.ts` | Idem |

---

## Fases de Implementação

### Fase 1 — Enums, interfaces e mapa de eventos

Sem dependências de runtime. Criar:
- `enums/api-payment-webhook-event-type.enum.ts` — 27 eventos limpos (sem WAS, sem nome do provider)
- `enums/outbound-webhook-message-status.enum.ts`
- `interfaces/outbound-webhook-payload.interface.ts`
- `interfaces/dispatch-trigger-input.interface.ts`
- `interfaces/outbound-delivery-job.interface.ts`
- `maps/provider-event-to-api-event.map.ts`

**Mapeamento WebhookEvent → ApiPaymentWebhookEventType:**
```
PIX_CASH_IN_WAS_RECEIVED    → PIX_CASH_IN_RECEIVED
PIX_CASH_IN_WAS_CLEARED     → PIX_CASH_IN_CLEARED
PIX_CASHOUT_WAS_COMPLETED   → PIX_CASH_OUT_COMPLETED
PIX_CASHOUT_WAS_CANCELED    → PIX_CASH_OUT_CANCELED
PIX_CASHOUT_WAS_UNDONE      → PIX_CASH_OUT_UNDONE
PIX_REFUND_WAS_RECEIVED     → PIX_REFUND_RECEIVED
PIX_REFUND_WAS_CLEARED      → PIX_REFUND_CLEARED
PIX_QRCODE_WAS_CREATED      → PIX_QRCODE_CREATED
BOLETO_WAS_REGISTERED       → BOLETO_REGISTERED
BOLETO_CASH_IN_WAS_RECEIVED → BOLETO_CASH_IN_RECEIVED
BOLETO_CASH_IN_WAS_CLEARED  → BOLETO_CASH_IN_CLEARED
BOLETO_WAS_CANCELLED        → BOLETO_CANCELED
BILL_PAYMENT_WAS_RECEIVED   → BILL_PAYMENT_RECEIVED
BILL_PAYMENT_WAS_CREATED    → BILL_PAYMENT_CREATED
BILL_PAYMENT_WAS_CONFIRMED  → BILL_PAYMENT_COMPLETED
BILL_PAYMENT_HAS_FAILED     → BILL_PAYMENT_FAILED
BILL_PAYMENT_WAS_CANCELLED  → BILL_PAYMENT_CANCELED
BILL_PAYMENT_WAS_REFUSED    → BILL_PAYMENT_REFUSED
TED_CASH_OUT_WAS_APPROVED   → TED_CASH_OUT_APPROVED
TED_CASH_OUT_WAS_DONE       → TED_CASH_OUT_COMPLETED
TED_CASH_OUT_WAS_CANCELED   → TED_CASH_OUT_CANCELED
TED_CASH_OUT_WAS_REPROVED   → TED_CASH_OUT_REPROVED
TED_CASH_OUT_WAS_UNDONE     → TED_CASH_OUT_UNDONE
TED_CASH_IN_WAS_RECEIVED    → TED_CASH_IN_RECEIVED
TED_CASH_IN_WAS_CLEARED     → TED_CASH_IN_CLEARED
TED_REFUND_WAS_RECEIVED     → TED_REFUND_RECEIVED
TED_REFUND_WAS_CLEARED      → TED_REFUND_CLEARED
```

### Fase 2 — Entidades e migrations

**`webhook_configuration`** — configuração de webhook do cliente:
- `id` UUID PK
- `client_id` UUID FK → `client`
- `event_type` VARCHAR(100) — valor de `ApiPaymentWebhookEventType`
- `url` VARCHAR(500) — URL HTTPS do cliente
- `public_key` VARCHAR(255) — chave pública HMAC enviada no header
- `private_key` VARCHAR(255) `select: false` — segredo HMAC para assinatura
- `is_active` BOOL DEFAULT true
- `circuit_breaker_failure_count` INT DEFAULT 0
- `circuit_breaker_open_until` DATETIME NULL — null = circuito fechado
- `created_at`, `updated_at`, `deleted_at`
- Índices: `(client_id)`, `(client_id, event_type)`, `(client_id, is_active)`

**`webhook_message`** — rastreamento de entrega:
- `id` UUID PK
- `configuration_id` UUID FK → `webhook_configuration`
- `client_id` UUID (desnormalizado)
- `event_type` VARCHAR(100)
- `provider_event_name` VARCHAR(100) — valor original do `WebhookEvent`
- `provider_slug` VARCHAR(50)
- `payload` JSON — array completo enviado ao cliente
- `status` VARCHAR(50) DEFAULT 'PENDING'
- `attempt_count` INT DEFAULT 0
- `last_attempted_at`, `delivered_at` DATETIME NULL
- `last_error` TEXT NULL
- `response_status_code` INT NULL
- `correlation_id` VARCHAR(100) NULL
- `created_at`, `updated_at`
- Índices: `(configuration_id)`, `(client_id)`, `(status)`, `(created_at)`, `(provider_event_name)`

### Fase 3 — Repositories e DTOs

- `webhook-configuration.repository.ts`: métodos `findActiveForEvent(clientId, eventType)`, `findById()`, `save()`, `softDelete()`
- `webhook-message.repository.ts`: métodos `create()`, `updateStatus()`, `findByFilters()`, `findFailedByConfig()`
- DTOs com class-validator; URL validada com `@IsUrl({ require_tld: true })`; em produção exigir HTTPS via custom validator

### Fase 4 — Serviços principais

**`WebhookHmacSigningService`** — puro, sem I/O:
```typescript
sign(uri: string, rawBody: string, publicKey: string, privateKey: string): HmacSignatureResult
// preHashedString = `${publicKey}&${encodeURIComponent(uri.lower())}&${timestamp}&${nonce}&${base64(rawBody)}`
// signature = hmac-sha256(privateKey, preHashedString).digest('base64')
// authorization = `hmac ${signature}`
```

**`OutboundWebhookDispatchService`**:
1. Mapeia `providerEventName` → `ApiPaymentWebhookEventType` via `PROVIDER_EVENT_TO_API_EVENT`
2. Busca `WebhookConfiguration` ativos para `(clientId, eventType)` com `circuitBreakerOpenUntil IS NULL OR < NOW()`
3. Para cada config: constrói `OutboundWebhookPayload[]`, cria `WebhookMessage` (status PENDING), enfileira job com `jobId = webhookMessage.id`
4. Nunca propaga erro (fire-and-forget do ponto de vista do processor)

**Payload enviado ao cliente (array):**
```json
[{
  "entityId": "...",
  "companyKey": "<clientId>",
  "name": "PIX_CASH_OUT_COMPLETED",
  "timestamp": "ISO8601",
  "correlationId": "...",
  "metadata": { "clientId": "...", "provider": "HIPERBANCO", "environment": "PRODUCTION" },
  "data": { /* campos do evento */ }
}]
```

**`ProviderWebhookBootstrapService`** (OnApplicationBootstrap):
1. Se `PROVIDER_WEBHOOK_BOOTSTRAP_ENABLED !== 'true'`, retorna
2. `ProviderSessionHelper.executeWithRetry()` → obtém sessão Hiperbanco
3. `HiperbancoWebhookHelper.listWebhooks()` → lista webhooks existentes no provider
4. Para cada entrada do `HIPERBANCO_WEBHOOK_MANIFEST`:
   - Monta `callbackUrl = API_PAYMENT_PUBLIC_URL + entry.callbackPath`
   - Se já existe no provider com mesmo `eventName` e `uri` → skip
   - Se existe com `eventName` mas `uri` diferente → `updateWebhook()`
   - Senão → `registerWebhook()` com `name = 'SYSTEM_<eventName>'`
5. Erros por entrada são capturados e logados; não aborta o boot

### Fase 5 — Fila e processor de entrega

Adicionar ao queue-policy.catalog.ts:
```typescript
webhookOutboundDelivery: {
  name: 'webhook-outbound-delivery',
  ...webhookEventQueueOptions,   // 5 tentativas, exponential backoff 5s
  defaultJobOptions: { ...webhookEventQueueOptions.defaultJobOptions, removeOnFail: { age: 3600 } },
}
```

**`OutboundWebhookDeliveryProcessor`** (`@Processor('webhook-outbound-delivery')`):
1. Carrega `WebhookMessage` — se não PENDING, ignora (idempotência)
2. Verifica circuit breaker: se `circuitBreakerOpenUntil > NOW()` → marca CIRCUIT_OPEN, sem re-throw (não reprocessar enquanto aberto)
3. Serializa payload → JSON, assina via `WebhookHmacSigningService`
4. HTTP POST com headers: `Authorization: hmac <sig>`, `X-Webhook-Timestamp`, `X-Webhook-Nonce`, `X-Webhook-Event`, `X-Webhook-Delivery-Id`, `Content-Type: application/json`
5. **Sucesso (2xx):** message = DELIVERED, `deliveredAt = NOW()`, reset `circuitBreakerFailureCount = 0`, `circuitBreakerOpenUntil = null`
6. **Falha (non-2xx / timeout / network):** incrementa `attemptCount`, `circuitBreakerFailureCount`; se `failureCount >= THRESHOLD (env, default 5)` → `circuitBreakerOpenUntil = NOW() + OPEN_DURATION (env, default 5min)`; re-throw para Bull reprocessar
7. `@OnQueueFailed`: se última tentativa → message = FAILED

### Fase 6 — Trigger e hook nos processors existentes

**`OutboundWebhookDispatchTrigger`** (thin wrapper, nunca propaga erro):
```typescript
async schedule(input: DispatchTriggerInput): Promise<void> {
  try { await this.dispatchService.dispatch(input); }
  catch (error) { this.logger.error(...); } // nunca throw
}
```

**Modificação nos 4 processors existentes — exatamente o mesmo padrão:**

```typescript
// Adicionar no topo do arquivo (const, não altera lógica existente):
const PIX_EVENT_TYPE_TO_WEBHOOK_EVENT: Record<PixWebhookEventType, WebhookEvent> = {
  [PixWebhookEventType.CASH_IN_RECEIVED]:   WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
  [PixWebhookEventType.CASH_OUT_COMPLETED]: WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,
  // ... todos os tipos
};

// Adicionar ao constructor:
private readonly outboundDispatchTrigger: OutboundWebhookDispatchTrigger,

// Adicionar após o fechamento do switch (antes do logger.log de sucesso):
await this.outboundDispatchTrigger.schedule({
  clientId: data.clientId,
  providerEventName: PIX_EVENT_TYPE_TO_WEBHOOK_EVENT[data.eventType],
  events: data.events,
  providerSlug: data.providerSlug,
});
```

### Fase 7 — Controllers, módulo e app

**`WebhookConfigurationController`** (`/webhooks/configurations`):
- Guards: `BackofficeAuthGuard` (padrão existente do projeto)
- `POST /` → 201 Created
- `GET /` → 200 lista configs do cliente (sem `private_key`)
- `GET /:id` → 200
- `PATCH /:id` → 200
- `DELETE /:id` → 204 (soft delete)
- `PATCH /:id/toggle` → 200 (flip `isActive`)

**`WebhookMessageController`** (`/webhooks/messages`):
- `GET /` → 200 com filtros: `status`, `eventType`, `configurationId`, `startDate`, `endDate`, `page`, `pageSize`
- `GET /:id` → 200
- `POST /reprocess` → 202 (reenfileira messages FAILED por lista de IDs ou configurationId)

**Composição do módulo (`WebhooksModule`):**
- `imports`: `TypeOrmModule.forFeature([WebhookConfiguration, WebhookMessage])`, `BullModule.registerQueue(...)`, `HttpModule`, `WebhookModule` (já exporta `ProviderSessionHelper` + `HiperbancoWebhookHelper`), `LoggerModule`, `ConfigModule`
- `exports`: `OutboundWebhookDispatchTrigger`, `OutboundWebhookDispatchService`, `WebhookConfigurationService`, `WebhookMessageService`

**Mudança em `webhook.module.ts`:** adicionar `ProviderSessionHelper` a `exports` (já está em `providers`).

---

## Manifesto Hiperbanco

```typescript
// src/modules/webhooks/manifest/hiperbanco-webhook.manifest.ts
export const HIPERBANCO_WEBHOOK_MANIFEST = [
  { eventName: WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,    context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/cash-in/received' },
  { eventName: WebhookEvent.PIX_CASH_IN_WAS_CLEARED,     context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/cash-in/cleared' },
  { eventName: WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,   context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/cash-out/completed' },
  { eventName: WebhookEvent.PIX_CASHOUT_WAS_CANCELED,    context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/cash-out/canceled' },
  { eventName: WebhookEvent.PIX_CASHOUT_WAS_UNDONE,      context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/cash-out/undone' },
  { eventName: WebhookEvent.PIX_REFUND_WAS_RECEIVED,     context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/refund/received' },
  { eventName: WebhookEvent.PIX_REFUND_WAS_CLEARED,      context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/refund/cleared' },
  { eventName: WebhookEvent.PIX_QRCODE_WAS_CREATED,      context: WebhookContext.PIX,     callbackPath: '/webhook/hiperbanco/pix/qrcode/created' },
  { eventName: WebhookEvent.BOLETO_WAS_REGISTERED,       context: WebhookContext.BOLETO,  callbackPath: '/webhook/hiperbanco/boleto/registered' },
  { eventName: WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED, context: WebhookContext.BOLETO,  callbackPath: '/webhook/hiperbanco/boleto/cash-in/received' },
  { eventName: WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,  context: WebhookContext.BOLETO,  callbackPath: '/webhook/hiperbanco/boleto/cash-in/cleared' },
  { eventName: WebhookEvent.BOLETO_WAS_CANCELLED,        context: WebhookContext.BOLETO,  callbackPath: '/webhook/hiperbanco/boleto/cancelled' },
  { eventName: WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,   context: WebhookContext.PAYMENT, callbackPath: '/webhook/hiperbanco/bill-payment/received' },
  { eventName: WebhookEvent.BILL_PAYMENT_WAS_CREATED,    context: WebhookContext.PAYMENT, callbackPath: '/webhook/hiperbanco/bill-payment/created' },
  { eventName: WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,  context: WebhookContext.PAYMENT, callbackPath: '/webhook/hiperbanco/bill-payment/confirmed' },
  { eventName: WebhookEvent.BILL_PAYMENT_HAS_FAILED,     context: WebhookContext.PAYMENT, callbackPath: '/webhook/hiperbanco/bill-payment/failed' },
  { eventName: WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,  context: WebhookContext.PAYMENT, callbackPath: '/webhook/hiperbanco/bill-payment/cancelled' },
  { eventName: WebhookEvent.BILL_PAYMENT_WAS_REFUSED,    context: WebhookContext.PAYMENT, callbackPath: '/webhook/hiperbanco/bill-payment/refused' },
  { eventName: WebhookEvent.TED_CASH_OUT_WAS_APPROVED,   context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/cash-out/approved' },
  { eventName: WebhookEvent.TED_CASH_OUT_WAS_DONE,       context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/cash-out/done' },
  { eventName: WebhookEvent.TED_CASH_OUT_WAS_CANCELED,   context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/cash-out/canceled' },
  { eventName: WebhookEvent.TED_CASH_OUT_WAS_REPROVED,   context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/cash-out/reproved' },
  { eventName: WebhookEvent.TED_CASH_OUT_WAS_UNDONE,     context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/cash-out/undone' },
  { eventName: WebhookEvent.TED_CASH_IN_WAS_RECEIVED,    context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/cash-in/received' },
  { eventName: WebhookEvent.TED_CASH_IN_WAS_CLEARED,     context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/cash-in/cleared' },
  { eventName: WebhookEvent.TED_REFUND_WAS_RECEIVED,     context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/refund/received' },
  { eventName: WebhookEvent.TED_REFUND_WAS_CLEARED,      context: WebhookContext.TED,     callbackPath: '/webhook/hiperbanco/ted/refund/cleared' },
];
```

---

## Variáveis de Ambiente Novas

| Variável | Obrigatória | Padrão | Uso |
|---|---|---|---|
| `API_PAYMENT_PUBLIC_URL` | Sim (bootstrap) | — | Base URL da API; prefixo das callbackPaths do manifesto |
| `PROVIDER_WEBHOOK_BOOTSTRAP_ENABLED` | Não | `false` | `true` para ativar sync automático no startup |
| `OUTBOUND_WEBHOOK_CIRCUIT_BREAKER_THRESHOLD` | Não | `5` | Falhas consecutivas para abrir o circuito |
| `OUTBOUND_WEBHOOK_CIRCUIT_BREAKER_OPEN_DURATION_MS` | Não | `300000` | Duração do circuito aberto (5 min) |
| `OUTBOUND_WEBHOOK_ENVIRONMENT` | Não | `PRODUCTION` | Valor de `metadata.environment` no payload |

---

## Verificação End-to-End

1. **Startup sync:** com `PROVIDER_WEBHOOK_BOOTSTRAP_ENABLED=true` e `API_PAYMENT_PUBLIC_URL` configurados, ao subir a API, verificar logs de `ProviderWebhookBootstrapService` mostrando skip/register/update para cada entrada do manifesto.

2. **Fluxo de despacho:** criar um `WebhookConfiguration` via `POST /webhooks/configurations` com um `eventType` válido. Simular um webhook do Hiperbanco no endpoint existente (ex: `POST /webhook/hiperbanco/pix/cash-out/completed`). Verificar que um `WebhookMessage` foi criado na tabela e que o job foi enfileirado na fila `webhook-outbound-delivery`.

3. **Entrega HMAC:** confirmar que o header `Authorization: hmac <base64>` é enviado e que a assinatura é válida (testar com `WebhookHmacSigningService` diretamente em testes unitários).

4. **Circuit breaker:** configurar `OUTBOUND_WEBHOOK_CIRCUIT_BREAKER_THRESHOLD=2`. Fazer o endpoint do cliente retornar 500 duas vezes. Confirmar que `circuitBreakerOpenUntil` é preenchido e próximos jobs ficam com status `CIRCUIT_OPEN`.

5. **Reprocessamento:** chamar `POST /webhooks/messages/reprocess` com IDs de mensagens FAILED. Confirmar que novos jobs são criados na fila.

6. **Testes unitários críticos:**
   - `WebhookHmacSigningService.sign()` — produz assinatura determinística dado nonce/timestamp fixo
   - `provider-event-to-api-event.map.ts` — todos os 27 valores de `WebhookEvent` têm mapeamento
   - `OutboundWebhookDispatchTrigger.schedule()` — nunca propaga erro mesmo se `dispatchService` lançar

---

## Arquivos Críticos de Referência

- [src/webhook-processor/processors/pix-webhook.processor.ts](src/webhook-processor/processors/pix-webhook.processor.ts)
- [src/webhook-processor/webhook-processor.module.ts](src/webhook-processor/webhook-processor.module.ts)
- [src/queue/policies/queue-policy.catalog.ts](src/queue/policies/queue-policy.catalog.ts)
- [src/webhook/webhook.module.ts](src/webhook/webhook.module.ts)
- [src/webhook/helpers/hiperbanco/hiperbanco-webhook.helper.ts](src/webhook/helpers/hiperbanco/hiperbanco-webhook.helper.ts)
- [src/webhook/helpers/provider-session.helper.ts](src/webhook/helpers/provider-session.helper.ts)
- [src/app.module.ts](src/app.module.ts)
- [src/webhook-processor/enums/webhook-event.enum.ts](src/webhook-processor/enums/webhook-event.enum.ts)
