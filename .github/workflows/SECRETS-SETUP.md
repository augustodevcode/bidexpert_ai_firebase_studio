# ============================================================================

# GitHub Secrets - Matrix Git Branch -> PostgreSQL Provider -> Vercel Environment

# ============================================================================

# demo-stable -> DEMO -> Neon PostgreSQL

# hml -> HML -> Prisma Postgres

# main -> PROD -> Supabase PostgreSQL

# ============================================================================

## 📋 Checklist de Secrets Necessários

### 1. Vercel Integration

```bash
VERCEL_TOKEN                    # Token de deploy do Vercel
VERCEL_ORG_ID                   # ID da organização Vercel
VERCEL_PROJECT_ID               # ID do projeto Vercel
```

### 2. Database URLs por Ambiente (OBRIGATÓRIO)

```bash
# DEMO / demo-stable / Neon
DEMO_POSTGRES_PRISMA_URL        # pooled runtime URL (schema url)
DEMO_POSTGRES_URL_NON_POOLING   # direct URL (schema directUrl)
DEMO_DATABASE_URL               # fallback legado durante transição
DEMO_DATABASE_URL_DIRECT        # fallback legado direto durante transição

# HML / hml / Prisma Postgres
HML_POSTGRES_PRISMA_URL         # pooled/runtime URL
HML_POSTGRES_URL_NON_POOLING    # direct URL for prisma db push / migrate
HML_DATABASE_URL                # fallback legado
HML_DATABASE_URL_DIRECT         # fallback legado direto

# PROD / main / Supabase
PROD_POSTGRES_PRISMA_URL        # pooled/runtime URL
PROD_POSTGRES_URL_NON_POOLING   # direct URL for prisma CLI
PROD_DATABASE_URL               # fallback legado
PROD_DATABASE_URL_DIRECT        # fallback legado direto
SUPABASE_DATABASE_URL           # alias opcional explícito do provider
SUPABASE_DATABASE_URL_DIRECT    # alias opcional explícito direto
```

### 3. Application Config

```bash
DEMO_NEXTAUTH_SECRET            # Secret de autenticação da DEMO
DEMO_APP_URL                    # URL da DEMO
HML_NEXTAUTH_SECRET             # Secret de autenticação da HML
HML_APP_URL                     # URL da HML
NEXTAUTH_SECRET                 # Secret padrão de produção
AUTH_SECRET                     # Secret de auth da produção
PROD_NEXTAUTH_SECRET            # Alias opcional explícito da produção
PROD_AUTH_SECRET                # Alias opcional explícito da produção
```

### 4. Versionamento por Branch no Vercel

```bash
NEXT_PUBLIC_APP_VERSION         # production (main)
# preview + demo-stable         # configurada via `vercel env add ... preview demo-stable`
# preview + hml                 # configurada via `vercel env add ... preview hml`
```

---

## 🚀 Como Configurar Secrets

### Via GitHub CLI (Recomendado)

```powershell
# 1. Vercel Token (obter em: https://vercel.com/account/tokens)
gh secret set VERCEL_TOKEN --body "vck_YOUR_VERCEL_TOKEN_HERE"

# 2. Vercel Org/Project IDs (obter com: vercel project ls)
gh secret set VERCEL_ORG_ID --body "your-org-id-here"
gh secret set VERCEL_PROJECT_ID --body "prj_your_project_id_here"

# 3. DEMO / Neon
gh secret set DEMO_POSTGRES_PRISMA_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
gh secret set DEMO_POSTGRES_URL_NON_POOLING --body "postgresql://user:pass@host/db?sslmode=require"
gh secret set DEMO_DATABASE_URL --body "postgresql://user:pass@host/db?sslmode=require"
gh secret set DEMO_DATABASE_URL_DIRECT --body "postgresql://user:pass@host/db?sslmode=require"

# 4. HML / Prisma Postgres
gh secret set HML_POSTGRES_PRISMA_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
gh secret set HML_POSTGRES_URL_NON_POOLING --body "postgresql://user:pass@host/db?sslmode=require"
gh secret set HML_DATABASE_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
gh secret set HML_DATABASE_URL_DIRECT --body "postgresql://user:pass@host/db?sslmode=require"

# 5. PROD / Supabase
gh secret set PROD_POSTGRES_PRISMA_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
gh secret set PROD_POSTGRES_URL_NON_POOLING --body "postgresql://user:pass@host/db?sslmode=require"
gh secret set PROD_DATABASE_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
gh secret set PROD_DATABASE_URL_DIRECT --body "postgresql://user:pass@host/db?sslmode=require"
gh secret set SUPABASE_DATABASE_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
gh secret set SUPABASE_DATABASE_URL_DIRECT --body "postgresql://user:pass@host/db?sslmode=require"

# 6. NextAuth Secret (gerar com: openssl rand -base64 32)
gh secret set DEMO_NEXTAUTH_SECRET --body "sua-chave-secreta-32-caracteres"
gh secret set HML_NEXTAUTH_SECRET --body "sua-chave-secreta-hml-32-caracteres"
gh secret set NEXTAUTH_SECRET --body "sua-chave-secreta-producao-32-caracteres"
gh secret set AUTH_SECRET --body "sua-chave-auth-producao-32-caracteres"

# 7. App URLs
gh secret set DEMO_APP_URL --body "https://demo.bidexpert.com.br"
gh secret set HML_APP_URL --body "https://hml.bidexpert.com.br"
```

### Via GitHub Web Interface

1. Acesse: https://github.com/augustodevcode/bidexpert_ai_firebase_studio/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione cada secret da lista acima

---

## 📖 Convenção de URLs PostgreSQL

### `*_POSTGRES_PRISMA_URL` (OBRIGATÓRIO)

- **Uso**: Runtime da aplicação — Prisma Client em produção
- **Protocolo**: `postgresql://` + `?pgbouncer=true`
- **Referência no schema**: `url = env("POSTGRES_PRISMA_URL")`
- **Provider mapping**:
  - DEMO = Neon
  - HML = Prisma Postgres
  - PROD = Supabase

### `*_POSTGRES_URL_NON_POOLING` (OBRIGATÓRIO)

- **Uso**: Prisma CLI — `prisma db push`, `prisma migrate`, seeds
- **Protocolo**: `postgresql://` (sem pgbouncer)
- **Referência no schema**: `directUrl = env("POSTGRES_URL_NON_POOLING")`
- **Por que direto**: pgbouncer não suporta algumas operações DDL

### `*_DATABASE_URL` / aliases legados

- **Uso**: Fallback geral e código legado
- **Valor**: mesma URL direta ou pooled dependendo do provider do ambiente

---

## 🔍 Verificar Secrets Configurados

```powershell
# Listar todos os secrets (sem mostrar valores)
gh secret list

# Verificar se secret específico existe
gh secret list | Select-String "POSTGRES"
```

---

## 🎯 Como Disparar Workflow com Seed

### 1. Via Commit Message (Automático)

```powershell
git add .
git commit -m "docs: update schema [seed]"
git push origin demo-stable
```

- ✅ Deploy automático no Vercel
- ✅ Schema push automático
- ✅ Seed automático (35 usuários com habilitações)

### 2. Via GitHub Actions (Manual)

1. Acesse: https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions
2. Selecione "Deploy DEMO to Vercel"
3. Clique em "Run workflow"
4. Selecione branch: `demo-stable`
5. Clique em "Run workflow"

### 3. Via GitHub CLI

```powershell
gh workflow run "Deploy DEMO to Vercel" --ref demo-stable
gh workflow run "Deploy HML to Vercel" --ref hml
gh workflow run "Deploy PROD to Vercel" --ref main
```

---

## ✅ Validar Sucesso do Seed

### 1. Verificar Logs do Workflow

```powershell
# Abrir UI do GitHub Actions
gh run list --workflow="Deploy DEMO to Vercel" --limit 1
gh run view --log

# Procurar por:
# ✅ Users: 35+ | Tenants: 1+ | Auctions: 10+
```

### 2. Verificar na Aplicação DEMO

- Acesse: https://demo.bidexpert.com.br/admin/habilitacoes
- Grid deve estar populado com usuários em diferentes colunas:
  - PENDING_DOCUMENTS: 9 usuários
  - PENDING_ANALYSIS: 8 usuários
  - REJECTED_DOCUMENTS: 4 usuários (com motivos de rejeição)
  - BLOCKED: 2 usuários
  - HABILITADO: 9 usuários

---

## 🐛 Troubleshooting

### Erro: branch de preview sobrescrevendo outra branch

**Causa**: variável adicionada em `preview` genérico, sem branch (`demo-stable` ou `hml`).
**Solução**: usar `vercel env add <name> preview <git-branch>` e `vercel env rm <name> preview <git-branch>`.

### Erro: "environment variable not found: POSTGRES_PRISMA_URL"

**Causa**: o workflow não projetou os secrets do ambiente para as variáveis genéricas `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING`.
**Solução**: configure os secrets `DEMO_*`, `HML_*` ou `PROD_*` e mantenha os fallbacks legados apenas durante a transição.

### Erro: "Can't reach database server" em db push

**Causa**: Usando URL pooled (pgbouncer) para operação de schema
**Solução**: Confirmar que o secret `*_POSTGRES_URL_NON_POOLING` está configurado para o ambiente certo

### Erro: "the URL must start with the protocol `mysql://`"

**Causa**: Prisma Client foi gerado para MySQL, não PostgreSQL
**Solução**: Verificar step `Copy PostgreSQL schema` roda antes de `Generate Prisma Client`

### Erro: "Model userOnTenant not found"

**Causa**: Schema não tem `@@map("UsersOnTenants")`
**Solução**: Verificar se commit mais recente do schema.postgresql.prisma foi aplicado

### Workflow não dispara automaticamente

**Causa**: Commit sem `[seed]` na mensagem
**Solução**: Adicionar `[seed]` ao commit message ou disparar manualmente
