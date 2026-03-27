# Contratos de Providers (Interfaces)

Este documento descreve os contratos canonicos usados pelo dominio.
As interfaces vivem em `src/financial-providers/contracts` e os normalizers
de webhook em `src/webhook-processor/contracts`.

## AuthProvider
Arquivo: `src/financial-providers/contracts/auth.provider.ts`
- `loginBackoffice(dto: unknown): Promise<LoginBackofficeResult>`
- `loginBank(dto: unknown, clientId: string): Promise<LoginBankResult>`

## PixProvider
Arquivo: `src/financial-providers/contracts/pix.provider.ts`
- `transfer(...)`
- `getKeys(...)`
- `registerKey(...)`
- `deleteKey(...)`
- `validateKey(...)`
- `generateStaticQrCode(...)`
- `generateDynamicQrCode(...)`
- `decodeQrCode(...)`

## BoletoProvider
Arquivo: `src/financial-providers/contracts/boleto.provider.ts`
- `create(...)`
- `cancel(...)`
- `get(...)`
- `list(...)`

## BillPaymentProvider
Arquivo: `src/financial-providers/contracts/bill-payment.provider.ts`
- `create(...)`
- `cancel(...)`
- `get(...)`
- `list(...)`

## TedProvider
Arquivo: `src/financial-providers/contracts/ted.provider.ts`
- `transfer(...)`
- `get(...)`
- `list(...)`

## WebhookProvider (gestao)
Arquivo: `src/financial-providers/contracts/webhook.provider.ts`
- `register(...)`
- `list(...)`
- `update(...)`
- `delete(...)`

## Normalizers de Webhook (processamento)
Arquivos:
- `src/webhook-processor/contracts/pix-webhook-normalizer.ts`
- `src/webhook-processor/contracts/boleto-webhook-normalizer.ts`
- `src/webhook-processor/contracts/bill-payment-webhook-normalizer.ts`
- `src/webhook-processor/contracts/ted-webhook-normalizer.ts`

Responsabilidade:
- Converter payloads por provedor em payloads canonicos usados pelos processors.
- Validar headers quando necessario (assinatura/publicKey).

## Registry (resolucao por provedor)
Arquivos:
- `src/financial-providers/registry/*` (auth, pix, boleto, bill-payment, ted)
- `src/webhook-processor/registries/*` (normalizers)

Responsabilidade:
- Expor `get(provider)` e esconder implementacoes concretas.
