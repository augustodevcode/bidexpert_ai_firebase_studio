# Skill: E2E Authentication & Tenant Resolution

## Objetivo
Garantir que todos os testes E2E usem autenticação centralizada, credenciais canônicas e resolução correta de tenant.

## Arquivos Principais

| Arquivo | Propósito |
|---------|-----------|
| `tests/e2e/helpers/auth-helper.ts` | Helper centralizado de autenticação |
| `tests/e2e/global-setup.ts` | Setup global com seed gate |
| `tests/e2e/auth-login-tenant.spec.ts` | Testes BDD de auth/tenant |
| `src/app/auth/actions.ts` | Server actions de login |
| `src/middleware.ts` | Resolução de tenant via subdomínio |
| `scripts/ultimate-master-seed.ts` | Seed canônico |

## Credenciais Canônicas

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | `admin@bidexpert.com.br` | `Admin@123` |
| Leiloeiro | `carlos.silva@construtoraabc.com.br` | `Test@12345` |
| Comprador | `comprador@bidexpert.com.br` | `Test@12345` |
| Advogado | `advogado@bidexpert.com.br` | `Test@12345` |
| Vendedor | `vendedor@bidexpert.com.br` | `Test@12345` |
| Analista | `analista@lordland.com` | `password123` |

**Senha `senha@123` é INCORRETA** — nunca usar.

## Regras Obrigatórias

### 1. Helper Centralizado
Todo novo teste E2E DEVE importar `tests/e2e/helpers/auth-helper.ts`:

```typescript
import { loginAsAdmin, loginAs, CREDENTIALS, ensureSeedExecuted } from './helpers/auth-helper';
```

**NUNCA** duplicar login logic inline nos testes.

### 2. URLs com Subdomínio
Em testes E2E, SEMPRE usar URLs com subdomínio para auto-lock do tenant:
- `http://demo.localhost:9005` (correto)
- `http://localhost:9005` (incorreto — tenant não resolvido)

### 3. Seed Gate
`global-setup.ts` executa `ensureSeedExecuted()` automaticamente antes dos testes.
Se o banco estiver vazio → executa `npm run db:seed`.
Se o seed falhar → erro explícito com mensagem clara.

### 4. Tenant Resolution (Middleware)
O middleware extrai o subdomínio via regex `^([a-z0-9-]+)\.localhost$`:
- `demo.localhost:9005` → `x-tenant-id: "demo"` → tenant selector **auto-locked**
- `dev.localhost:9006` → `x-tenant-id: "dev"` → tenant selector **auto-locked**
- `localhost:9005` (sem subdomínio) → seleção manual obrigatória

### 5. Login Action (`src/app/auth/actions.ts`)
A action `login()` resolve o tenant pelo campo `subdomain` (não `slug`):
```typescript
const tenant = await prisma.tenant.findFirst({
  where: { subdomain: tenantId }
});
```

### 6. DevUserSelector
Em `NODE_ENV=development`, a página de login exibe `DevUserSelector` com até 15 usuários.
Permite login com 1 clique. NÃO usar em testes automatizados — preferir helper centralizado.

## Exports do auth-helper.ts

```typescript
// Tipos
export type CredentialRole = 'admin' | 'leiloeiro' | 'comprador' | 'advogado' | 'vendedor' | 'analista';

// Credenciais
export const CREDENTIALS: Record<CredentialRole, { email: string; password: string }>;

// Login genérico
export async function loginAs(page: Page, role: CredentialRole, baseUrl: string, options?: LoginOptions): Promise<void>;

// Shortcuts
export async function loginAsAdmin(page: Page, baseUrl: string): Promise<void>;
export async function loginAsLawyer(page: Page, baseUrl: string): Promise<void>;
export async function loginAsBuyer(page: Page, baseUrl: string): Promise<void>;
export async function loginAsAuctioneer(page: Page, baseUrl: string): Promise<void>;

// Seed Gate
export async function ensureSeedExecuted(baseUrl: string): Promise<void>;

// Tenant Selection
export async function selectTenant(page: Page, tenantName: string): Promise<void>;
```

## BDD Scenarios (auth-login-tenant.spec.ts)

| ID | Cenário | Validação |
|----|---------|-----------|
| BDD-AUTH-01 | Tenant auto-lock via subdomínio | Selector desabilitado em `demo.localhost` |
| BDD-AUTH-02 | Login admin + redirect | Após login, redireciona para `/admin` ou `/dashboard` |
| BDD-AUTH-03 | Seed gate bloqueia DB vazio | Erro explícito se seed não executado |
| BDD-AUTH-04 | DevUserSelector visível em dev | Componente renderizado com lista de usuários |
| BDD-AUTH-05 | DevUserSelector auto-login | Clique em usuário preenche form e submete |

## Checklist para Novos Testes

- [ ] Importar `auth-helper.ts` (não duplicar login)
- [ ] Usar URL com subdomínio (`demo.localhost:PORT`)
- [ ] Usar credenciais do mapa `CREDENTIALS`
- [ ] Adicionar `data-ai-id` nos elementos testados
- [ ] Verificar seed gate ativo no `global-setup.ts`
