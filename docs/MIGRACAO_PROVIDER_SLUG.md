# Migracao `provider_slug`

Objetivo: padronizar `provider_slug` como string com valores do enum `FinancialProvider`
(ex: `hiperbanco`, `itau`, `hiperbank`), evitando inconsistencias de casing.

## Passos sugeridos
1. Inventario
   - listar tabelas com `provider_slug`
   - listar valores distintos (lower/upper/mistos)

2. Padronizacao
   - escolher padrao final (ex: lowercase)
   - mapear valores antigos -> novos

3. Migracao de dados
   - atualizar registros existentes para o padrao final
   - validar integridade (contagens e amostras)

4. Schema
   - garantir tipo `varchar` (ou enum no app) e tamanho coerente
   - adicionar indice quando usado em filtros

5. App
   - garantir que DTOs e services escrevam sempre no padrao
   - adicionar validacao de input

## Exemplo de SQL (mysql)
```
-- 1) listar valores atuais
SELECT provider_slug, COUNT(*) FROM transaction GROUP BY provider_slug;

-- 2) padronizar lowercase
UPDATE transaction SET provider_slug = LOWER(provider_slug);

-- 3) garantir indice (exemplo)
CREATE INDEX idx_transaction_provider_slug ON transaction(provider_slug);
```

## Observacoes
- executar em janela controlada e monitorar logs de integracao.
- considerar migracao por batches se a tabela for grande.
