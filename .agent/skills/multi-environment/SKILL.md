# 🔀 Skill: Multi-Environment Workflow (DEV ↔ DEMO ↔ PROD)

## 📸 Evidência Obrigatória para PR (Playwright)
- Todo PR deve incluir print(s)/screenshot(s) de sucesso dos testes Playwright.
- Deve incluir link do relatório de execução (Playwright/Vitest UI) e cenário validado.
- PR sem evidência visual não deve ser aprovado nem mergeado.

## Descrição

Esta skill define o workflow de desenvolvimento com isolamento de ambientes para o projeto BidExpert, garantindo que:
- **Usuários humanos** testam no ambiente **DEMO** (Vercel + PostgreSQL)
- **Agentes AI** trabalham no ambiente **DEV** (Local Docker + MySQL)
- **Produção** (`main`) é protegida com branch protection e CI verde obrigatório

## Quando Usar Esta Skill

- Ao iniciar qualquer implementação ou correção
- Ao configurar novo desenvolvedor (humano ou AI)
- Ao fazer deploy para Vercel
- Ao criar/gerenciar branches

## Arquitetura de Ambientes

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION (main)                          │
│  Vercel + PostgreSQL + Blob Storage                            │
│  Branch: main (PROTEGIDO)                                       │
│  URL: https://bidexpert.vercel.app                             │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ PR + CI Verde
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    DEMO (demo-stable)                           │
│  Vercel + Prisma Postgres + Blob Storage                       │
│  Branch: demo-stable                                            │
│  URL: https://bidexpert-demo.vercel.app                        │
│  Uso: Testes do usuário humano                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Feature branches
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      DEV (local)                                │
│  Docker + MySQL + Local Storage                                │
│  Branch: feat/*, fix/*, chore/*                                │
│  URL: http://dev.localhost:9006                                │
│  Uso: Desenvolvimento por agentes AI                           │
└─────────────────────────────────────────────────────────────────┘
```

## Mapeamento de Ambientes

| Ambiente | Infraestrutura | Database | Porta | Branch Base | Uso Principal |
|----------|----------------|----------|-------|-------------|---------------|
| **DEV** | Docker local | MySQL `bidexpert_dev` | 9006 | `demo-stable` | Agentes AI |
| **DEMO** | Vercel | PostgreSQL | - | `demo-stable` | Usuário humano |
| **PROD** | Vercel | PostgreSQL | - | `main` | Produção |

## Workflow de Branches

```
main (produção - PROTEGIDO)
  │
  └── demo-stable (base estável para features)
        │
        ├── feat/auction-filter-20260131-1430
        ├── fix/login-bug-20260131-1500
        └── chore/update-deps-20260131-1530
```

### Regras de Branch

1. **`main`** = **PRODUÇÃO**
   - Nunca alterar diretamente
   - Somente via PR aprovado com CI verde
   - Branch protection ativo

2. **`demo-stable`** = Base para features
   - Sempre começar branches daqui
   - Deploy automático para Vercel DEMO
   - Merge via PR

3. **Feature branches** = Desenvolvimento ativo
   - Formato: `<tipo>/<descricao>-<timestamp>`
   - Tipos: `feat/`, `fix/`, `chore/`, `docs/`, `test/`
   - Exemplo: `feat/auction-filter-20260131-1430`

## Checklist do Agente AI

### Ao Iniciar Qualquer Task

```powershell
# 1. Verificar se usuário está em DEMO (porta 9005 ocupada)
netstat -ano | findstr "9005"

# 2. Se ocupada → Usar DEV na porta 9006
$env:PORT=9006
$env:DATABASE_URL="mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_dev"

# 3. Criar branch a partir de demo-stable
git fetch origin demo-stable
git checkout demo-stable
git pull origin demo-stable
git checkout -b feat/minha-feature-$(Get-Date -Format "yyyyMMdd-HHmm")

# 4. Iniciar ambiente DEV
node .vscode/start-9006-dev.js
```

### Durante o Desenvolvimento

1. Commits frequentes e atômicos
2. Testes a cada alteração significativa
3. Usar helpers de compatibilidade MySQL/PostgreSQL

### Ao Finalizar

1. Push de todos os commits
2. Criar PR para `demo-stable`
3. Aguardar CI verde
4. **SOLICITAR AUTORIZAÇÃO** do usuário antes de merge

## Compatibilidade MySQL ↔ PostgreSQL

### Problema

MySQL é case-insensitive por padrão, PostgreSQL é case-sensitive.

### Solução

Usar helpers de compatibilidade em `src/lib/prisma/query-helpers.ts`:

```typescript
import { insensitiveContains, insensitiveEquals } from '@/lib/prisma/query-helpers';

// ✅ CORRETO
const results = await prisma.auction.findMany({
  where: {
    title: insensitiveContains('termo')
  }
});

// ❌ INCORRETO - Só funciona em PostgreSQL
const results = await prisma.auction.findMany({
  where: {
    title: { contains: 'termo', mode: 'insensitive' }
  }
});
```

### Funções Disponíveis

| Função | Descrição |
|--------|-----------|
| `getDatabaseType()` | Retorna 'mysql' ou 'postgresql' |
| `isMySQL()` | Retorna true se MySQL |
| `isPostgreSQL()` | Retorna true se PostgreSQL |
| `insensitiveContains(value)` | contains case-insensitive |
| `insensitiveStartsWith(value)` | startsWith case-insensitive |
| `insensitiveEndsWith(value)` | endsWith case-insensitive |
| `insensitiveEquals(value)` | equals case-insensitive |

## Arquivos de Configuração

### Vercel

- **`vercel.json`**: Configuração do projeto Vercel
- **`.env.demo.vercel.example`**: Template de variáveis de ambiente

### GitHub Actions

- **`.github/workflows/deploy-demo-vercel.yml`**: Deploy automático para Vercel
- **`.github/workflows/branch-protection.yml`**: CI para PRs

### Prisma Schemas

- **`prisma/schema.prisma`**: Schema MySQL (desenvolvimento local)
- **`prisma/schema.postgresql.prisma`**: Schema PostgreSQL (Vercel)

### Scripts

- **`scripts/prepare-vercel-demo.ps1`**: Prepara e executa deploy local

## Variáveis de Ambiente

### DEV (MySQL local)

```env
PORT=9006
DATABASE_URL="mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_dev"
NODE_ENV=development
```

### DEMO (Vercel PostgreSQL)

```env
DATABASE_URL="postgresql://..."
POSTGRES_URL="postgresql://...?pgbouncer=true"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NODE_ENV=production
```

## Deploy para Vercel

### Via GitHub Actions (Recomendado)

1. Push para `demo-stable`
2. Workflow `deploy-demo-vercel.yml` executa automaticamente
3. Smoke tests validam o deploy

### Via Script Local

```powershell
.\scripts\prepare-vercel-demo.ps1

# Ou apenas preview
.\scripts\prepare-vercel-demo.ps1 -Preview

# Ou dry-run (não executa deploy)
.\scripts\prepare-vercel-demo.ps1 -DryRun
```

## Secrets Necessários no GitHub

| Secret | Descrição |
|--------|-----------|
| `VERCEL_TOKEN` | Token de API do Vercel |
| `VERCEL_ORG_ID` | ID da organização Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto (`prj_4tz3zXk6sCgHUJg1TTSNnLQ9UgIs`) |
| `DEMO_DATABASE_URL` | URL PostgreSQL com pooling |
| `DEMO_DATABASE_URL_DIRECT` | URL PostgreSQL direta (para migrate) |
| `DEMO_NEXTAUTH_SECRET` | Secret do NextAuth |
| `DEMO_APP_URL` | URL do app DEMO |

## Troubleshooting

### Erro: "Port 9005 already in use"

```powershell
# Usar porta alternativa
$env:PORT=9006
node .vscode/start-9006-dev.js
```

### Erro: "mode: insensitive not supported"

Está usando MySQL. Use os helpers de compatibilidade:

```typescript
import { insensitiveContains } from '@/lib/prisma/query-helpers';
```

### Erro no deploy Vercel: "Schema validation failed"

```powershell
# Copiar schema PostgreSQL
cp prisma/schema.postgresql.prisma prisma/schema.prisma
npx prisma validate
```

### CI falhou no branch protection

1. Verificar logs do GitHub Actions
2. Corrigir erros de typecheck/build
3. Push novamente

## Referências

- [AGENTS.md](../../../AGENTS.md) - Diretrizes globais para agentes
- [copilot-instructions.md](../../copilot-instructions.md) - Instruções detalhadas
- [query-helpers.ts](../../../src/lib/prisma/query-helpers.ts) - Helpers de compatibilidade
