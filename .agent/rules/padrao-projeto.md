---
trigger: always_on
---

### 1.1 Arquitetura Modular (NestJS)
- Sempre seguir a arquitetura modular do NestJS
- Cada módulo deve ter: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- Módulos devem ser auto-contidos e ter responsabilidades bem definidas
- Usar `@Module()` decorator com imports, controllers, providers e exports apropriados

### 1.2 Separação de Responsabilidades
- **Controller**: Apenas recebe requisições, valida entrada, chama service e retorna resposta
- **Service**: Contém toda a lógica de negócio
- **Repository**: Apenas acesso a dados (quando necessário criar repositórios customizados)
- **DTO**: Validação e transformação de dados
- **Entity**: Modelo de dados do banco
- **Interface**: Contratos e tipos

### 1.3 Estrutura de Pastas
Cada módulo deve seguir esta estrutura:
```markdown:.cursorrules
<code_block_to_apply_changes_from>
module-name/
├── dto/              # Data Transfer Objects
├── entities/         # Entidades TypeORM
├── enums/            # Enumeradores
├── interfaces/       # Interfaces TypeScript
├── docs/             # Decorators de documentação Swagger
├── tests/            # Testes unitários
│   ├── factory/      # Factories para testes
│   └── mocks/        # Mocks para testes
├── helpers/          # Funções auxiliares (quando necessário)
├── repositories/     # Repositórios customizados (quando necessário)
├── module-name.controller.ts
├── module-name.service.ts
└── module-name.module.ts
```

### 1.4 Helpers e Funções Auxiliares
- **SEMPRE** colocar funções auxiliares em arquivos separados por contexto na pasta `helpers/`
- **Helpers de módulo**: Se a função é usada apenas dentro de um módulo específico, deve estar em `module-name/helpers/`
  - Exemplo: `src/student/helpers/student-guardian.helper.ts`
  - Organizar por contexto: criar arquivos separados por funcionalidade (ex: `student-guardian.helper.ts`, `student-validation.helper.ts`)
- **Helpers globais**: Se a função é usada em múltiplos módulos, deve estar em `src/common/helpers/`
  - Exemplo: `src/common/helpers/date.helpers.ts`
  - Organizar por contexto: criar arquivos separados por funcionalidade (ex: `date.helpers.ts`, `string.helpers.ts`)
- Nomenclatura: usar kebab-case com sufixo `.helper.ts` (singular) ou `.helpers.ts` (plural quando o arquivo contém múltiplas funções relacionadas)
- Funções helpers devem ser puras quando possível (sem efeitos colaterais)
- Documentar funções helpers complexas com JSDoc

## 2. PADRÕES DE CÓDIGO

### 2.1 DTOs (Data Transfer Objects)
- **SEMPRE** usar DTOs para entrada e saída de dados
- DTOs devem implementar interfaces correspondentes: `export class CreateXDto implements IX`
- Usar decorators de validação do `class-validator`:
  - `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsEnum()`, `@IsEmail()`, etc.
  - `@Length()`, `@Min()`, `@Max()`, `@Matches()` para validações específicas
- Usar `@ValidateNested()` e `@Type()` para objetos aninhados
- Usar `@ApiProperty()` do Swagger para documentação
- DTOs de query devem estender `BaseQueryDto` quando aplicável

### 2.2 Interfaces
- Criar interfaces para todos os DTOs: `export interface IX { ... }`
- Interfaces devem definir a estrutura de dados sem validação
- Usar interfaces para contratos entre camadas

### 2.3 Enums
- Usar enums TypeScript para constantes tipadas
- Enums devem ter valores descritivos
- Exemplo: `export enum CommonStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', CANCELLED = 'CANCELLED' }`

### 2.4 Soft Delete
- **SEMPRE** usar soft delete para entidades principais
- Adicionar `@DeleteDateColumn()` nas entidades
- Usar `softDelete()` e `restore()` do TypeORM
- Verificar status antes de operações críticas

### 2.5 Transações
- Usar transações do TypeORM para operações que envolvem múltiplas entidades
- Sempre tratar erros dentro de transações

### 2.6 Custom Exceptions
- **SEMPRE** usar `CustomHttpException` ao invés de exceções genéricas
- Incluir `ErrorCode` apropriado
- Mensagens devem ser claras e descritivas

## 3. PADRÕES DE REPOSITÓRIO

### 3.1 Repositórios Customizados
- Criar repositórios customizados quando houver lógica de query complexa
- Repositórios devem estender ou usar `Repository<T>` do TypeORM
- Usar `@Injectable()` decorator
- Padrão de nomenclatura: `XRepository`

### 3.2 BaseQueryService
- **SEMPRE** usar `BaseQueryService` para queries com paginação, filtros e busca
- Padrão de uso:

```typescript
const queryOptions = this.baseQueryService.buildQueryOptions(
  this.repository,
  queryDto,
  {
    relations: ['relation1', 'relation2'],
    defaultSortBy: 'createdAt',
    searchFields: ['field1', 'field2'],
    dateField: 'createdAt',
    filters: [{ field: 'status' }],
  },
);
return this.baseQueryService.findAll(this.repository, queryOptions);
```
### 3.3 Interface Base para Repositórios
- Criar interface base para repositórios quando houver padrões comuns
- Exemplo: `interface IBaseRepository<T> { findAll(): Promise<T[]>; findById(id: string): Promise<T>; }`

## 4. PADRÕES DE SEGURANÇA

### 4.1 Autenticação JWT
- Usar JWT para autenticação stateless
- Implementar refresh tokens
- Tokens devem ter expiração configurável

### 4.2 RBAC (Role-Based Access Control)
- Usar sistema de permissões baseado em roles
- Usar `@RequirePermissions()` em controllers
- Sempre proteger endpoints com `@UseGuards(PermissionsGuard)`

### 4.3 Rate Limiting
- Aplicar rate limiting em endpoints públicos
- Configurar via `@nestjs/throttler`

### 4.4 Sanitização de Dados
- Usar interceptors para remover campos sensíveis
- Nunca retornar senhas, tokens ou dados sensíveis nas respostas

## 5. PADRÕES DE AUDITORIA
- Usar `@Audit()` em todos os endpoints que modificam dados
- Configurar apropriadamente:

## 6. PADRÕES DE LOGGING ESTRUTURADO

### 6.1 Winston Logger
- **SEMPRE** usar Winston para logging estruturado
- **NUNCA** usar `console.log`, `console.error`, etc.

### 6.2 Uso do Logger
- Usar níveis apropriados:
  - `logger.error()`: Erros críticos, exceções
  - `logger.warn()`: Avisos, situações não ideais
  - `logger.log()` ou `logger.info()`: Informações gerais
  - `logger.debug()`: Informações de debug
  - `logger.verbose()`: Informações muito detalhadas

### 6.3 Contexto de Logging
- Sempre incluir contexto relevante nos logs:

```typescript
this.logger.log(
  `User ${userId} created employee ${employeeId}`,
  'EmployeeService',
);
this.logger.error(
  `Failed to create employee: ${error.message}`,
  error.stack,
  'EmployeeService',
);
```
### 6.4 Logging de Requisições

- Logar início e fim de requisições importantes
- Incluir correlation ID quando disponível
- Logar parâmetros de entrada (sem dados sensíveis)

## 7. PADRÕES DE DOCUMENTAÇÃO

### 7.1 Swagger/OpenAPI
- **SEMPRE** documentar endpoints com Swagger
- Criar decorators customizados em `docs/` para cada endpoint
- Usar `@ApiTags()`, `@ApiBearerAuth()`, `@ApiOperation()`, `@ApiResponse()`
- Documentar DTOs com `@ApiProperty()`

### 7.2 JSDoc
- Adicionar JSDoc em funções helpers complexas
- Padrão:
```typescript
/**
 * Cria um novo funcionário no sistema
 * @param createEmployeeDto - Dados do funcionário a ser criado
 * @returns Funcionário criado com todas as relações
 * @throws CustomHttpException se o documento já estiver registrado
 */
async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
  // ...
}
```

### 7.3 Documentação Markdown
- Manter documentação atualizada na pasta `docs/`
- Documentar padrões e decisões arquiteturais importantes

## 8. PADRÕES DE TESTES

### 8.1 Testes Unitários
- **SEMPRE** criar testes unitários para serviços
- Usar Jest como framework de testes
- Estrutura: `describe()` → `it()` → `expect()`
- Organizar testes em: `tests/`, `tests/factory/`, `tests/mocks/`

### 8.2 Factories e Mocks
- Criar factories para setup de testes: `tests/factory/*.factory.ts`
- Criar mocks organizados: `tests/mocks/*.mock.ts`
- Reutilizar factories e mocks entre testes

### 8.3 Cobertura de Testes
- Manter cobertura adequada (mínimo 70% recomendado)
- Testar casos de sucesso e falha
- Testar validações e regras de negócio

## 9. PADRÕES DE VALIDAÇÃO

### 9.1 Validação em DTOs
- Usar `class-validator` para validação
- Usar `ValidationPipe` global configurado
- Criar validators customizados quando necessário

### 9.2 Validators Customizados
- Criar validators quando validação for complexa ou reutilizável
- Usar `@ValidatorConstraint()` e `ValidatorConstraintInterface`
- Exemplo: `ValidateDateRangeConstraint`

## 10. PADRÕES DE TRATAMENTO DE ERROS

### 10.1 Filtro Global de Exceções
- Usar `HttpExceptionFilter` global
- Sempre retornar formato padronizado de erro
- Incluir `errorCode` e mensagem descritiva

### 10.2 Códigos de Erro
- Usar enum `ErrorCode` para todos os erros
- Adicionar novos códigos quando necessário
- Manter códigos organizados por módulo

## 11. PADRÕES DE CONFIGURAÇÃO
- **SEMPRE** usar `@nestjs/config` para variáveis de ambiente
- **SEMPRE** validar variáveis de ambiente na inicialização
- Criar schema de validação usando Joi ou Zod
- Validar todas as variáveis obrigatórias

### 11.2 Arquivo .env.example
- **SEMPRE** manter arquivo `.env.example` atualizado
- Incluir todas as variáveis necessárias com valores de exemplo
- Documentar cada variável com comentários
- Não incluir valores reais ou sensíveis

### 11.3 Configuração de Banco
- Usar connection pooling apropriado
- Configurar retry logic para conexões
- Usar variáveis de ambiente para todas as configurações

## 12. PADRÕES DE TYPESCRIPT

### 12.1 TypeScript Strict Mode
- Sempre tipar explicitamente quando TypeScript não inferir corretamente

### 12.2 Tipos e Interfaces
- Preferir interfaces para objetos
- Usar tipos para unions, intersections, etc.
- Evitar `any` - usar `unknown` quando necessário

## 13. PADRÕES DE RESPOSTA

### 13.1 Respostas Padronizadas
- Padronizar formato de respostas de sucesso
- Para criação: retornar entidade criada
- Para atualização: retornar `{ message: string }`
- Para exclusão: retornar `204 No Content`
- Para listagem: retornar `PaginationResult<T>`
- Para busca por ID: retornar entidade completa

### 13.2 Transformação de Dados
- Usar `class-transformer` para serialização
- Usar interceptors para transformação global
- Aplicar `@Exclude()`, `@Expose()`, `@Transform()` quando necessário

## 15. PADRÕES DE MIGRATIONS

### 15.1 Migrations
- **SEMPRE** usar migrations para mudanças no schema
- Nomear migrations descritivamente: `YYYYMMDDHHMMSS-description.ts`
- Incluir validações de integridade quando necessário
- Testar migrations em ambiente de desenvolvimento antes de produção
- Documentar migrations complexas

### 15.2 Seeds
- Tornar seeds idempotentes (podem ser executados múltiplas vezes)
- Implementar rollback quando possível
- Organizar seeds por funcionalidade
- Usar transações em seeds quando apropriado

## 16. PADRÕES DE QUALIDADE DE CÓDIGO
- **SEMPRE** seguir regras do ESLint configuradas
- **SEMPRE** formatar código com Prettier antes de commitar
- Executar `npm run lint` antes de commitar
- Corrigir todos os warnings do ESLint
- Usar path aliases `@/*` para imports internos
- Remover imports não utilizados

### 16.3 Nomenclatura

- Classes: PascalCase
- Arquivos: kebab-case
- Variáveis e funções: camelCase
- Constantes: UPPER_SNAKE_CASE
- Interfaces: PascalCase com prefixo I

## 17. PADRÕES DE PERFORMANCE

- Usar `select` para limitar campos retornados quando possível
- Carregar relações apenas quando necessário
- Usar índices apropriados no banco de dados
- Evitar N+1 queries

- **SEMPRE** usar paginação em listagens
- Limite padrão: 10 itens
- Limite máximo: 100 itens
- Retornar metadados de paginação

## 18. REGRAS GERAIS

- Funções devem fazer uma coisa e fazer bem
- Manter funções pequenas (< 50 linhas quando possível)
- Evitar código duplicado (DRY - Don't Repeat Yourself)
- Usar nomes descritivos para variáveis e funções
- Comentar código complexo ou não óbvio
- Evitar comentários óbvios
- Usar JSDoc para documentação de funções públicas