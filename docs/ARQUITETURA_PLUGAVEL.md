# Arquitetura Plugavel (Visao Geral)

Objetivo: permitir que a API integre novos provedores apenas plugando adapters, sem alterar o dominio (Pix, Boleto, TED, Bill Payment, Webhook).

## Principios
- DIP: dominio depende de contratos (interfaces), nao de implementacoes de provedor.
- OCP: novos provedores nao exigem alteracoes no dominio.
- ISP: contratos por capacidade (Pix/Boleto/TED/Webhook/Auth).
- ACL: DTOs internos nao vazam para o provedor.

## Camadas
1) Dominio (Pix/Boleto/TED/Bill Payment/Webhook)
   - Services orquestram regras e persistencia.
   - Nao importam `financial-providers/providers/*`.
2) Contracts (financial-providers/contracts)
   - Interfaces por capacidade.
3) Providers (financial-providers/providers/<provider>)
   - Implementam contratos e normalizadores de webhook.
4) Infra (TypeORM, Redis, Bull, Secrets, HTTP clients)

## Fluxo de requisicao (ex: Pix Transfer)
```
Controller (pix/:provider) 
  -> Service (PixService)
     -> Registry.getPixProvider(provider)
        -> ProviderAdapter (HiperbancoPixProvider)
     -> persistencia + transaction
```

## Fluxo de webhook (plugavel)
```
Controller (webhook/:provider/<capability>)
  -> NormalizerRegistry.get(provider)
     -> Normalizer (ex: HiperbancoPixWebhookNormalizer)
  -> Queue (Bull)
  -> Processor
  -> Service de dominio (PixWebhookService)
```

## Sessao e provider no path
- Toda rota que conversa com provedor usa `:provider`.
- Sessao autenticada salva `providerSlug`.
- Guard valida `:provider` vs `providerSlug`.

## Multi-provider por cliente
- Um cliente pode ter varias sessoes ativas, uma por provedor (e opcionalmente por conta).
- A selecao do provedor e explicita no path (ex: `pix/:provider/*`).

## Decisoes chave
- Registry por capacidade evita `switch(provider)`.
- Normalizer por provedor permite webhook heterogeneo sem alterar processors.
- Contratos canonicamente tipados centralizam a evolucao do dominio.
