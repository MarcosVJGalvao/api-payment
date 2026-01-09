# Database Seeds

Este diretório contém os arquivos de seed para popular o banco de dados com dados iniciais.

## Estrutura

- `permissions.seed.ts` - Cria permissões (scopes) globais do sistema
- `internal-user.seed.ts` - Cria usuários internos
- `index.ts` - Orquestra a execução de todos os seeds
- `run-seeds.ts` - Script principal para executar os seeds

## Como usar

Execute o comando:

```bash
npm run seed
```

## Dados criados

### Permissões (Scopes)

As seguintes permissões globais são criadas como scopes que podem ser vinculados aos clients:

- **Financial**: 
  - `financial:boleto` - Acesso a operações de boleto
  - `financial:payment` - Acesso a operações de pagamento
- **Integration**: 
  - `integration:webhook` - Acesso ao gerenciamento de webhooks
- **Auth**: 
  - `auth:bank` - Acesso à autenticação bank
  - `auth:backoffice` - Acesso à autenticação backoffice

### Usuário Interno

- **Username**: `admin`
- **Email**: `admin@api-payments.com`
- **Password**: `admin123` (deve ser alterada após o primeiro login)

## Como vincular scopes aos clients

As permissões são criadas como scopes globais. Para vincular um scope a um client específico, você pode:

1. Criar uma permissão específica do client (com `clientId` preenchido)
2. Ou usar roles para agrupar permissões e vincular a role ao client

Exemplo: Para dar acesso a `financial:boleto` para um client, você pode criar uma role com essa permissão e vincular a role ao client através da tabela `client_role`.

## Notas

- Os seeds são idempotentes: podem ser executados múltiplas vezes sem criar duplicatas
- Se uma permissão ou usuário já existir, será ignorado
- As permissões são criadas como globais (clientId: null) e podem ser vinculadas a clients específicos depois
