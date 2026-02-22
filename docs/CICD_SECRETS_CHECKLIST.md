/**
 * @fileoverview Documentação dos Secrets necessários para a pipeline de CI/CD
 * com Semantic Release, Vercel Deploy e Prisma Migrations.
 * 
 * CONFIGURAÇÃO OBRIGATÓRIA:
 * Todos os secrets listados aqui devem ser configurados em:
 * GitHub → Settings → Secrets and Variables → Actions
 */

# 🔐 Secrets Necessários para CI/CD Pipeline

## GitHub Actions Secrets (Obrigatórios)

| Secret | Descrição | Onde Obter |
|--------|-----------|------------|
| `GITHUB_TOKEN` | Token automático do GitHub Actions | ✅ Já fornecido automaticamente pelo GitHub |
| `VERCEL_TOKEN` | Token de acesso à API do Vercel | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | ID da organização/team no Vercel | `team_1uJcNSOUsOdZ37TfXo0zZskp` |
| `VERCEL_PROJECT_ID` | ID do projeto no Vercel | `prj_4tz3zXk6sCgHUJg1TTSNnLQ9UgIs` |

## Database Secrets (Para Migrations Automáticas)

| Secret | Descrição | Ambiente |
|--------|-----------|----------|
| `PROD_DATABASE_URL_DIRECT` | URL direta do PostgreSQL de produção | PRD (main) |
| `DEMO_DATABASE_URL_DIRECT` | URL direta do PostgreSQL de demonstração | DEMO (demo-stable) |

> ⚠️ Use URLs **diretas** (não pooled) para migrations. Formato:
> `postgresql://user:pass@host:5432/dbname?sslmode=require`

## Variáveis de Ambiente Vercel (Configuradas automaticamente pelo workflow)

| Variável | Descrição | Gerenciada por |
|----------|-----------|----------------|
| `NEXT_PUBLIC_APP_VERSION` | Versão semântica atual (ex: 1.2.3) | `release.yml` → inject-version job |
| `NEXT_PUBLIC_BUILD_ID` | Hash curto do commit (7 chars) | `next.config.mjs` via VERCEL_GIT_COMMIT_SHA |
| `NEXT_PUBLIC_BUILD_ENV` | Ambiente (production/preview/development) | `next.config.mjs` via VERCEL_ENV |

## Como Configurar

### 1. GitHub Secrets
```bash
# Via GitHub CLI
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "team_1uJcNSOUsOdZ37TfXo0zZskp"
gh secret set VERCEL_PROJECT_ID --body "prj_4tz3zXk6sCgHUJg1TTSNnLQ9UgIs"
gh secret set PROD_DATABASE_URL_DIRECT --body "postgresql://..."
gh secret set DEMO_DATABASE_URL_DIRECT --body "postgresql://..."
```

### 2. Vercel Environment Variables
O workflow `release.yml` job `inject-version` configura automaticamente
`NEXT_PUBLIC_APP_VERSION` via Vercel CLI após cada release.

### 3. Validação
```bash
# Verificar secrets configurados
gh secret list

# Verificar env vars no Vercel
vercel env ls --scope team_1uJcNSOUsOdZ37TfXo0zZskp
```

## Fluxo de Versão

```
commit (conventional) → push → GitHub Actions → semantic-release
  → Gera tag + release notes
  → Atualiza CHANGELOG.md
  → Injeta NEXT_PUBLIC_APP_VERSION no Vercel
  → Executa migrations (se main/demo-stable)
  → Notifica no PR/issue
```
