# ============================================================================
# GitHub Secrets - DEMO Environment (Vercel + Neon PostgreSQL)
# ============================================================================
# ⚠️  IMPORTANTE: A integração Prisma Postgres (demo-bidexpert-prisma-cloud)
# foi REMOVIDA porque estava SUSPENSA, causando "Provisioning integrations failed"
# em todos os deploys. Use APENAS variáveis Neon listadas abaixo.
# ============================================================================

## 📋 Checklist de Secrets Necessários

### 1. Vercel Integration
```bash
VERCEL_TOKEN                    # Token de deploy do Vercel
VERCEL_ORG_ID                   # ID da organização Vercel
VERCEL_PROJECT_ID               # ID do projeto Vercel
```

### 2. Neon PostgreSQL Database URLs (OBRIGATÓRIO)
```bash
# Obtidas em: Vercel Dashboard → Project → Settings → Environment Variables
# (injetadas automaticamente pela integração Neon)

POSTGRES_PRISMA_URL             # pgbouncer URL para runtime Prisma (OBRIGATÓRIO — schema url)
# postgresql://[user]:[pass]@[host]/[db]?sslmode=require&pgbouncer=true

POSTGRES_URL_NON_POOLING        # URL direta para schema push/migrations (OBRIGATÓRIO — schema directUrl)
# postgresql://[user]:[pass]@[host]/[db]?sslmode=require

DATABASE_URL                    # URL de conexão base (fallback)
# postgresql://[user]:[pass]@[host]/[db]?sslmode=require

# Opcional (fallback adicional)
POSTGRES_URL                    # pgbouncer URL genérica
DEMO_DATABASE_URL               # Legacy fallback — manter durante transição
```

### 3. Application Config
```bash
DEMO_NEXTAUTH_SECRET            # Secret para NextAuth.js
DEMO_APP_URL                    # URL do app em produção (Vercel)
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

# 3. Neon URLs (obter em Vercel Dashboard → Project → Settings → Environment Variables)
gh secret set POSTGRES_PRISMA_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
gh secret set POSTGRES_URL_NON_POOLING --body "postgresql://user:pass@host/db?sslmode=require"
gh secret set DATABASE_URL --body "postgresql://user:pass@host/db?sslmode=require"
gh secret set POSTGRES_URL --body "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"

# 4. Legacy fallback (manter durante transição)
gh secret set DEMO_DATABASE_URL --body "postgresql://user:pass@host/db?sslmode=require"

# 5. NextAuth Secret (gerar com: openssl rand -base64 32)
gh secret set DEMO_NEXTAUTH_SECRET --body "sua-chave-secreta-32-caracteres"

# 6. App URL
gh secret set DEMO_APP_URL --body "https://bidexpertaifirebasestudio.vercel.app"
```

### Via GitHub Web Interface
1. Acesse: https://github.com/augustodevcode/bidexpert_ai_firebase_studio/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione cada secret da lista acima

---

## 📖 Variáveis Neon: Para que serve cada URL

### POSTGRES_PRISMA_URL (OBRIGATÓRIO)
- **Uso**: Runtime da aplicação — Prisma Client em produção
- **Protocolo**: `postgresql://` + `?pgbouncer=true`
- **Referência no schema**: `url = env("POSTGRES_PRISMA_URL")`
- **Por que pgbouncer**: Evita esgotamento de conexões em serverless

### POSTGRES_URL_NON_POOLING (OBRIGATÓRIO)
- **Uso**: Prisma CLI — `prisma db push`, `prisma migrate`, seeds
- **Protocolo**: `postgresql://` (sem pgbouncer)
- **Referência no schema**: `directUrl = env("POSTGRES_URL_NON_POOLING")`
- **Por que direto**: pgbouncer não suporta algumas operações DDL

### DATABASE_URL
- **Uso**: Fallback geral e código legado
- **Valor**: mesma URL direta ou pooled dependendo da configuração Neon

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
- Acesse: https://bidexpertaifirebasestudio.vercel.app/admin/habilitacoes
- Grid deve estar populado com usuários em diferentes colunas:
  - PENDING_DOCUMENTS: 9 usuários
  - PENDING_ANALYSIS: 8 usuários
  - REJECTED_DOCUMENTS: 4 usuários (com motivos de rejeição)
  - BLOCKED: 2 usuários
  - HABILITADO: 9 usuários

---

## 🐛 Troubleshooting

### Erro: "Provisioning integrations failed" no Vercel
**Causa**: Integração Prisma Postgres suspensa ainda vinculada ao projeto Vercel.
**Solução**: Acesse Vercel Dashboard → Project → Integrations → Remova a integração `demo-bidexpert-prisma-cloud`. O deploy passará a usar apenas as variáveis Neon.

### Erro: "environment variable not found: POSTGRES_PRISMA_URL"
**Causa**: Secret não configurado no GitHub Actions ou integração Neon não vinculada no Vercel.
**Solução**: Configure os secrets conforme a seção "Como Configurar Secrets" acima.

### Erro: "Can't reach database server" em db push
**Causa**: Usando URL pooled (pgbouncer) para operação de schema
**Solução**: Confirmar que `POSTGRES_URL_NON_POOLING` está configurado como secret

### Erro: "the URL must start with the protocol `mysql://`"
**Causa**: Prisma Client foi gerado para MySQL, não PostgreSQL
**Solução**: Verificar step `Copy PostgreSQL schema` roda antes de `Generate Prisma Client`

### Erro: "Model userOnTenant not found"
**Causa**: Schema não tem `@@map("UsersOnTenants")`
**Solução**: Verificar se commit mais recente do schema.postgresql.prisma foi aplicado

### Workflow não dispara automaticamente
**Causa**: Commit sem `[seed]` na mensagem
**Solução**: Adicionar `[seed]` ao commit message ou disparar manualmente

