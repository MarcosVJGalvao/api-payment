# Webhooks no api-payments

## Objetivo

Esta branch muda o modelo de integração de webhook para separar claramente dois fluxos:

1. `provider -> api-payments`: webhooks técnicos do provedor financeiro, usados apenas para entrada e processamento interno.
2. `api-payments -> integrador`: webhooks internos padronizados do `api-payments`, cadastrados pelo cliente/integrador para receber eventos de negócio.

Com isso, o integrador deixa de cadastrar webhooks diretamente no provider e passa a cadastrar apenas webhooks internos do `api-payments`.

## Resumo do que mudou na branch

### 1. Novo módulo de webhooks outbound

Foi criado o módulo [src/modules/webhooks/webhooks.module.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/webhooks.module.ts:1), responsável por:

- cadastro de configuração de webhook por cliente
- persistência das mensagens disparadas
- assinatura HMAC do payload de saída
- fila de entrega outbound
- reprocessamento de falhas
- bootstrap/sincronização dos webhooks técnicos no provider

### 2. Novo cadastro de webhook interno do api-payments

O cadastro consumido pelo integrador agora acontece em [src/modules/webhooks/controllers/webhook-configuration.controller.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/controllers/webhook-configuration.controller.ts:35).

Endpoints principais:

- `POST /webhooks/configurations`
- `GET /webhooks/configurations`
- `GET /webhooks/configurations/:id`
- `PATCH /webhooks/configurations/:id`
- `DELETE /webhooks/configurations/:id`
- `PATCH /webhooks/configurations/:id/toggle`

Esses endpoints operam sobre `eventType` interno do `api-payments`, não sobre `eventName` do provider.

### 3. Persistência dedicada para configuração e entrega

Foram criadas duas tabelas novas:

- [src/database/migrations/1769100000000-CreateWebhookConfigurationTable.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/database/migrations/1769100000000-CreateWebhookConfigurationTable.ts:1)
- [src/database/migrations/1769200000000-CreateWebhookMessageTable.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/database/migrations/1769200000000-CreateWebhookMessageTable.ts:1)

Modelagem:

- `webhook_configuration`: destino do cliente, evento interno, chaves e estado do circuit breaker
- `webhook_message`: histórico de entregas, payload, tentativas, erro final e status

Entidades:

- [src/modules/webhooks/entities/webhook-configuration.entity.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/entities/webhook-configuration.entity.ts:15)
- [src/modules/webhooks/entities/webhook-message.entity.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/entities/webhook-message.entity.ts:16)

### 4. Bootstrap automático/manual dos webhooks técnicos do provider

Os webhooks cadastrados no provider passaram a ser tratados como artefatos de sistema, definidos por manifesto:

- [src/modules/webhooks/manifest/hiperbanco-webhook.manifest.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/manifest/hiperbanco-webhook.manifest.ts:11)

O serviço [src/modules/webhooks/services/provider-webhook-bootstrap.service.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/services/provider-webhook-bootstrap.service.ts:13) faz:

- leitura do manifesto
- montagem da URL pública via `API_PAYMENT_PUBLIC_URL`
- listagem dos webhooks já existentes no provider
- `skip` quando a URL já está correta
- `update` quando a URL mudou
- `register` quando o webhook não existe
- persistência local na tabela antiga `webhook`

Além do bootstrap no `onApplicationBootstrap`, existe endpoint interno:

- `POST /internal/webhook/:provider/bootstrap`

Controller:

- [src/modules/webhooks/controllers/webhook-bootstrap-internal.controller.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/controllers/webhook-bootstrap-internal.controller.ts:24)

### 5. Tabela antiga `webhook` passou a aceitar webhook de sistema

A tabela antiga continua sendo usada para rastrear o cadastro técnico no provider, mas agora aceita `client_id = null` para webhooks de sistema:

- [src/database/migrations/1769300000000-MakeWebhookClientIdNullable.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/database/migrations/1769300000000-MakeWebhookClientIdNullable.ts:1)
- [src/webhook/entities/webhook.entity.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/webhook/entities/webhook.entity.ts:103)

### 6. Processadores inbound agora disparam webhook outbound interno

Após o processamento com sucesso do webhook recebido do provider, os processors passaram a chamar o trigger de outbound:

- [src/webhook-processor/processors/pix-webhook.processor.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/webhook-processor/processors/pix-webhook.processor.ts:132)
- [src/webhook-processor/processors/boleto-webhook.processor.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/webhook-processor/processors/boleto-webhook.processor.ts:84)
- `bill-payment` e `ted` seguiram o mesmo padrão

O trigger não quebra o fluxo inbound em caso de erro:

- [src/modules/webhooks/triggers/outbound-webhook-dispatch.trigger.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/triggers/outbound-webhook-dispatch.trigger.ts:14)

### 7. Normalização de eventos do provider para eventos internos

O disparo outbound usa um enum estável do `api-payments`:

- [src/modules/webhooks/enums/api-payment-webhook-event-type.enum.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/enums/api-payment-webhook-event-type.enum.ts:1)

O mapeamento provider -> api é centralizado em:

- [src/modules/webhooks/maps/provider-event-to-api-event.map.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/maps/provider-event-to-api-event.map.ts:4)

Esse ponto é o coração da mudança de contrato. O integrador se inscreve em `PIX_CASH_IN_RECEIVED`, `BOLETO_REGISTERED`, etc., sem depender do naming do provider.

### 8. Entrega outbound com assinatura, retry e circuit breaker

O serviço de despacho encontra as configurações ativas do cliente e cria mensagens para fila:

- [src/modules/webhooks/services/outbound-webhook-dispatch.service.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/services/outbound-webhook-dispatch.service.ts:18)

O processor de entrega:

- assina via HMAC
- envia `POST` HTTP para a URL do cliente
- registra status e tentativas
- abre circuit breaker após falhas consecutivas
- permite reprocessamento posterior

Arquivo:

- [src/modules/webhooks/processors/outbound-webhook-delivery.processor.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/processors/outbound-webhook-delivery.processor.ts:15)

Fila adicionada:

- [src/queue/policies/queue-policy.catalog.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/queue/policies/queue-policy.catalog.ts:75)

### 9. Consulta e reprocessamento de mensagens

Foram criados endpoints para operação e suporte:

- `GET /webhooks/messages`
- `GET /webhooks/messages/:id`
- `POST /webhooks/messages/reprocess`

Arquivos:

- [src/modules/webhooks/controllers/webhook-message.controller.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/controllers/webhook-message.controller.ts:31)
- [src/modules/webhooks/services/webhook-message.service.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/services/webhook-message.service.ts:15)

### 10. Ajustes no módulo legado de webhook

O módulo legado `src/webhook` continua responsável pelo relacionamento com o provider, mas sofreu adaptações:

- `clientId` opcional para webhooks de sistema
- sanitização de segredo de callback
- atualização/remoção mais resiliente
- uso do helper com retry para chamadas ao provider
- remoção do endpoint público de criação para integrador

Arquivos principais:

- [src/webhook/webhook.service.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/webhook/webhook.service.ts:25)
- [src/webhook/webhook-internal.controller.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/webhook/webhook-internal.controller.ts:23)
- [src/webhook/webhook.controller.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/webhook/webhook.controller.ts:26)

## Novo fluxo de ponta a ponta

1. O sistema define, em manifesto, quais webhooks técnicos precisam existir no provider.
2. O bootstrap registra/atualiza esses webhooks técnicos apontando para rotas inbound do `api-payments`.
3. O provider envia eventos para o `api-payments`.
4. O `api-payments` processa o evento internamente e atualiza suas entidades de domínio.
5. Ao final do processamento com sucesso, o sistema traduz o evento do provider para um `eventType` interno.
6. O sistema busca as configurações outbound ativas do cliente para esse `eventType`.
7. O sistema gera registros em `webhook_message` e agenda a entrega na fila.
8. O worker envia o payload assinado para a URL do integrador.
9. Em caso de falha, a mensagem fica rastreável, retryável e sujeita a circuit breaker.

## Contrato que outras APIs devem seguir

### Regra principal

Outras APIs não devem pedir ao integrador que cadastre webhooks no provider. O integrador deve cadastrar apenas webhooks internos da própria API.

### Modelo recomendado

#### Camada 1: inbound técnico do provider

Responsabilidade:

- receber eventos do provider
- validar autenticidade
- enfileirar/processar
- atualizar domínio interno

Características:

- rotas internas/operacionais
- contrato acoplado ao provider
- cadastro controlado pelo sistema, nunca pelo integrador

#### Camada 2: outbound funcional da API

Responsabilidade:

- expor eventos de negócio estáveis ao integrador
- manter contrato próprio da API
- permitir observabilidade, retry e reprocessamento

Características:

- endpoints de cadastro para o cliente
- enum de eventos interno da API
- payload padronizado e independente do provider

## Guia de implementação para outra API

### 1. Criar um enum interno de eventos

A nova API deve definir um enum próprio, semelhante a [src/modules/webhooks/enums/api-payment-webhook-event-type.enum.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/enums/api-payment-webhook-event-type.enum.ts:1).

Regras:

- nomes orientados a negócio
- sem referências ao provider
- estabilidade de contrato entre versões

### 2. Criar um mapa provider -> evento interno

Centralize a tradução em um único arquivo, como [src/modules/webhooks/maps/provider-event-to-api-event.map.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/maps/provider-event-to-api-event.map.ts:4).

Regras:

- todo evento inbound suportado precisa de mapeamento explícito
- ausência de mapeamento deve gerar `warn`, nunca disparo inconsistente

### 3. Criar tabelas de configuração e mensagem

Replicar a separação:

- `webhook_configuration`
- `webhook_message`

Campos mínimos em configuração:

- `client_id`
- `event_type`
- `url`
- `public_key`
- `private_key`
- `is_active`
- contadores de circuit breaker

Campos mínimos em mensagem:

- `configuration_id`
- `client_id`
- `event_type`
- `provider_event_name`
- `provider_slug`
- `payload`
- `status`
- `attempt_count`
- `last_error`
- `response_status_code`
- `correlation_id`

### 4. Expor CRUD de configurações outbound

A outra API deve oferecer endpoints equivalentes aos de [src/modules/webhooks/controllers/webhook-configuration.controller.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/controllers/webhook-configuration.controller.ts:35).

Regras:

- cadastro por cliente autenticado
- habilitar/desabilitar sem apagar histórico
- retornar `privateKey` apenas no create/update quando gerada ou trocada
- nunca expor segredo em listagens

### 5. Criar manifesto dos webhooks técnicos do provider

Se a API depender de provider externo, manter manifesto por provider, como em [src/modules/webhooks/manifest/hiperbanco-webhook.manifest.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/manifest/hiperbanco-webhook.manifest.ts:11).

O manifesto deve conter:

- evento do provider
- contexto
- rota interna de callback

### 6. Implementar bootstrap idempotente

Criar serviço equivalente ao [src/modules/webhooks/services/provider-webhook-bootstrap.service.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/services/provider-webhook-bootstrap.service.ts:13).

Comportamentos esperados:

- listar webhooks existentes no provider
- comparar URL atual com URL desejada
- `skip`, `update` ou `register`
- persistir o identificador externo retornado pelo provider
- permitir execução automática e manual

### 7. Disparar outbound só depois do processamento interno com sucesso

O disparo deve acontecer no final do processor inbound, seguindo o padrão dos processors em `src/webhook-processor/processors`.

Regras:

- não disparar antes de persistir o estado interno
- erro de outbound não deve quebrar o inbound
- registrar logs com contexto suficiente

### 8. Padronizar o payload outbound

Hoje o payload é montado em [src/modules/webhooks/services/outbound-webhook-dispatch.service.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/services/outbound-webhook-dispatch.service.ts:86) com estes campos:

- `entityId`
- `companyKey`
- `name`
- `timestamp`
- `correlationId`
- `metadata`
- `data`

Recomendação para outras APIs:

- preservar esse envelope sempre que possível
- manter `metadata.provider` e `metadata.environment`
- colocar no `data` apenas a visão de negócio necessária ao integrador

### 9. Assinar e entregar por fila

Replicar a ideia do processor [src/modules/webhooks/processors/outbound-webhook-delivery.processor.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/processors/outbound-webhook-delivery.processor.ts:27).

Obrigatório:

- envio assíncrono
- retry com backoff
- status persistido por tentativa
- assinatura HMAC
- headers padronizados
- circuit breaker para clientes indisponíveis

### 10. Expor observabilidade e reprocessamento

Toda API que adotar esse modelo deve ter:

- listagem de mensagens
- detalhe de mensagem
- reprocessamento por ids ou por configuração

Sem isso, operação e suporte ficam cegos após a entrega falhar.

## Variáveis de ambiente relevantes

Encontradas na implementação atual:

- `API_PAYMENT_PUBLIC_URL`
- `PROVIDER_WEBHOOK_BOOTSTRAP_ENABLED`
- `OUTBOUND_WEBHOOK_ENVIRONMENT`
- `OUTBOUND_WEBHOOK_TIMEOUT_MS`
- `OUTBOUND_WEBHOOK_CIRCUIT_BREAKER_THRESHOLD`
- `OUTBOUND_WEBHOOK_CIRCUIT_BREAKER_OPEN_DURATION_MS`

Referências:

- [src/modules/webhooks/services/provider-webhook-bootstrap.service.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/services/provider-webhook-bootstrap.service.ts:23)
- [src/modules/webhooks/processors/outbound-webhook-delivery.processor.ts](/c:/Users/marco/Projetos%20Pessoais/api-payments/src/modules/webhooks/processors/outbound-webhook-delivery.processor.ts:66)

## Checklist para replicar em outra API

1. Criar enum interno de eventos.
2. Criar mapa provider -> evento interno.
3. Criar tabelas `webhook_configuration` e `webhook_message`.
4. Criar CRUD de configuração por cliente.
5. Criar serviço de assinatura HMAC.
6. Criar fila e processor de entrega outbound.
7. Criar manifesto de webhooks técnicos por provider.
8. Criar bootstrap automático/manual para registrar webhooks técnicos.
9. Acionar dispatch ao final do processamento inbound bem-sucedido.
10. Criar endpoints de consulta e reprocessamento.
11. Garantir que o integrador veja apenas eventos internos da API.

## Decisão arquitetural consolidada

O provider deixa de ser parte do contrato público de webhook.

O contrato público passa a ser:

- `evento interno da API`
- `payload interno da API`
- `cadastro interno da API`
- `observabilidade interna da API`

Essa é a principal diretriz para qualquer nova API que queira adotar o padrão implementado nesta branch.
