# ============================================================================
# GitHub Secrets - DEMO Environment (Vercel + Prisma Cloud)
# ============================================================================

## 📋 Checklist de Secrets Necessários

### 1. Vercel Integration
```bash
VERCEL_TOKEN                    # Token de deploy do Vercel
VERCEL_ORG_ID                   # ID da organização Vercel
VERCEL_PROJECT_ID               # ID do projeto Vercel
```

### 2. Prisma Cloud Database URLs
```bash
DEMO_DATABASE_URL_DIRECT        # URL direta para schema push/migrations
# postgres://[tenant_id]:[api_key]@db.prisma.io:5432/postgres?sslmode=require
# Obter em: https://console.prisma.io → seu projeto → Connection URLs

DEMO_DATABASE_URL_ACCELERATE    # URL Accelerate para seed (runtime queries)
# prisma+postgres://accelerate.prisma-data.net/?api_key=[your_accelerate_api_key]
# Obter em: https://console.prisma.io → seu projeto → Prisma Accelerate
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

# 3. Prisma Cloud - Direct URL (para schema push)
gh secret set DEMO_DATABASE_URL_DIRECT --body "postgres://[tenant_id]:[api_key]@db.prisma.io:5432/postgres?sslmode=require"

# 4. Prisma Cloud - Accelerate URL (para seed/runtime)
gh secret set DEMO_DATABASE_URL_ACCELERATE --body "prisma+postgres://accelerate.prisma-data.net/?api_key=[your_accelerate_api_key]"

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

## 📖 Diferença entre URLs Prisma Cloud

### DEMO_DATABASE_URL_DIRECT
- **Uso**: Schema migrations, `prisma db push`
- **Protocolo**: `postgres://`
- **Endpoint**: `db.prisma.io:5432`
- **Limitação**: Conexões diretas podem ter restrições de rede

### DEMO_DATABASE_URL_ACCELERATE
- **Uso**: Runtime queries, seeds, aplicação
- **Protocolo**: `prisma+postgres://`
- **Endpoint**: `accelerate.prisma-data.net`
- **Vantagem**: Pooling, cache, melhor performance

---

## 🔍 Verificar Secrets Configurados

```powershell
# Listar todos os secrets (sem mostrar valores)
gh secret list

# Verificar se secret específico existe
gh secret list | Select-String "DEMO_DATABASE"
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

### 2. Verificar no Console Prisma
- Acesse: https://console.prisma.io/.../studio
- Tabela `User`: Deve ter 35+ registros
- Tabela `UserDocument`: Deve ter documentos associados
- Filtre por `habilitationStatus` para ver diferentes grupos

### 3. Verificar na Aplicação DEMO
- Acesse: https://bidexpertaifirebasestudio.vercel.app/admin/habilitacoes
- Grid deve estar populado com usuários em diferentes colunas:
  - PENDING_DOCUMENTS: 9 usuários
  - PENDING_ANALYSIS: 8 usuários
  - REJECTED_DOCUMENTS: 4 usuários (com motivos de rejeição)
  - BLOCKED: 2 usuários
  - HABILITADO: 9 usuários

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"
**Causa**: Usando URL_DIRECT em step de seed  
**Solução**: Seed deve usar URL_ACCELERATE

### Erro: "the URL must start with the protocol `mysql://`"
**Causa**: Prisma Client foi gerado para MySQL, não PostgreSQL  
**Solução**: Verificar step `Copy PostgreSQL schema` roda antes de `Generate Prisma Client`

### Erro: "Model userOnTenant not found"
**Causa**: Schema não tem `@@map("UsersOnTenants")`  
**Solução**: Verificar se commit mais recente do schema.postgresql.prisma foi aplicado

### Workflow não dispara automaticamente
**Causa**: Commit sem `[seed]` na mensagem  
**Solução**: Adicionar `[seed]` ao commit message ou disparar manualmente
