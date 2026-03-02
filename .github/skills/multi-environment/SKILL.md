---
name: multi-environment
description: Workflow de isolamento de ambientes DEV, DEMO e PROD com regras de branch, portas e compatibilidade de banco para o BidExpert.
---

# 🔀 Skill: Multi-Environment Workflow (DEV ↔ DEMO ↔ PROD)

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

## 🌲 Isolamento Primário: Git Worktree

O modelo de isolamento **preferido** no BidExpert é via **Git Worktree** — mais rápido que Docker e com isolamento de branch nativo.

### Scripts Helper (RECOMENDADO)
```powershell
# Criar worktree (auto-detecta porta livre, npm install, configura .env.local)
./scripts/create-worktree.ps1 -Tipo feat -Descricao minha-feature -Start

# Remover worktree após merge
./scripts/remove-worktree.ps1 -Dir ..\bidexpert-feat-minha-feature -DeleteBranch
```

### Manual
```powershell
# Ver worktrees e portas já em uso
git worktree list
netstat -ano | Select-String ":900[5-9]|:901" | Select-Object -First 10

# Criar worktree para nova task (porta livre, ex: 9006)
$porta = 9006
$branch = "feat/minha-feature-$(Get-Date -Format 'yyyyMMdd-HHmm')"
git worktree add ..idexpert-feat-minha-feature -b $branch origin/demo-stable

Set-Location ..idexpert-feat-minha-feature
$env:PORT = $porta ; npm install ; npm run dev
```

> 📖 **Skill completa:** `.github/skills/git-worktree-isolation/SKILL.md`

### Tabela de Portas por Worktree

| Porta | Worktree | Quem |
|-------|----------|------|
| 9005  | Principal / DEMO | Usuário humano |
| 9006  | DEV worktree #1 | Agente AI #1 |
| 9007  | DEV worktree #2 | Agente AI #2 |
| 9008  | Hotfix / PR review | Ad-hoc |
| 9009+ | Extras | Ad-hoc |

## Checklist do Agente AI

### Ao Iniciar Qualquer Task

**Scripts Helper (RECOMENDADO):**
```powershell
./scripts/create-worktree.ps1 -Tipo feat -Descricao minha-feature -Start
```

**Manual:**
```powershell
# 1. Ver worktrees ativos + portas em uso
git worktree list
netstat -ano | Select-String ":900[5-9]|:901" | Select-Object -First 10

# 2. Atualizar demo-stable
git fetch origin demo-stable

# 3. Criar worktree com nova branch a partir de demo-stable
$porta     = 9006  # porta livre conforme tabela
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$branch    = "feat/minha-feature-$timestamp"
$dir       = "..\bidexpert-feat-minha-feature"

git worktree add $dir -b $branch origin/demo-stable

# 4. Configurar e iniciar no worktree
Set-Location $dir
$env:PORT = $porta ; npm install ; npm run dev
# Acesso: http://dev.localhost:$porta
```

> **Docker Sandbox** — usar apenas se precisar de banco completamente isolado:
> `docker compose -f docker-compose.dev-isolated.yml up -d --build`

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
# ✅ PREFERIDO: Criar worktree em outra porta (sem docker)
$porta = 9006  # ou 9007, 9008...
git worktree add ..idexpert-fix -b fix/issue-$(Get-Date -Format 'yyyyMMdd') origin/demo-stable
Set-Location ..idexpert-fix
$env:PORT = $porta ; npm install ; npm run dev

# ALTERNATIVA: Docker Sandbox (para banco isolado)
docker compose -f docker-compose.dev-isolated.yml down
docker compose -f docker-compose.dev-isolated.yml up -d --build
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
- [Vercel + PostgreSQL Deploy SKILL](../vercel-postgresql-deploy/SKILL.md) - Regras de deploy e compatibilidade PostgreSQL
