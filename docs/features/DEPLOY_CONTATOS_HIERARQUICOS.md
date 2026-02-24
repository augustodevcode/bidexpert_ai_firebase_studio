# 🚀 Guia de Deployment - Sistema de Contatos Hierárquicos

## 📋 Pré-Requisitos

- ✅ Feature branch criada: `feat/auction-contact-hierarchy-20260212-2351`
- ✅ Commit realizado com sucesso (hash: `eab893ba`)
- ✅ Branch publicada no GitHub
- ✅ Todos os arquivos TypeScript compilando sem erros
- ✅ Testes E2E criados e prontos para execução

## 🗄️ Migração de Banco de Dados

### Opção 1: Ambiente Local (MySQL)

```powershell
# 1. Gerar migration
npx prisma migrate dev --name add_auction_contact_fields

# 2. Aplicar migration
npx prisma migrate deploy

# 3. Gerar cliente Prisma
npx prisma generate
```

### Opção 2: Ambiente DEMO (PostgreSQL - Prisma Cloud)

```powershell
# 1. Definir URL do banco DEMO
$env:DATABASE_URL='postgres://1c998e66b185887460c8cb2dad77d45b51014931de4c10119b55274e0ae50e80:sk_geaZx-C8-_2lvXCV7HJoh@db.prisma.io:5432/postgres?sslmode=require'

# 2. Aplicar schema via db push (cuidado: verifica warnings antes)
npx prisma db push --skip-generate

# 3. OU criar migration manual (recomendado para produção)
npx prisma migrate dev --name add_auction_contact_fields --create-only
# Revisar SQL gerado em prisma/migrations/
npx prisma migrate deploy

# 4. Gerar cliente
npx prisma generate
```

### ⚠️ IMPORTANTE: Shadow Database

Se encontrar erro de **shadow database** com migrations antigas:
1. Arquivar migrations problemáticas (mover para `prisma/migrations/archive/`)
2. Criar baseline nova: `npx prisma migrate resolve --applied "migrations_problemáticas"`
3. Criar migration limpa: `npx prisma migrate dev`

## 🌱 Atualizar Seed Data

```powershell
# Executar seed master data atualizado (já inclui dados de teste)
$env:DATABASE_URL='postgres://...'  # URL do ambiente
npx tsx scripts/ultimate-master-seed.ts
```

**Dados de teste incluídos:**
- Leilão 1: Campos de contato específicos (prioridade 1)
- Leiloeiros: Campo `supportWhatsApp` populado
- PlatformSettings: Já possui campos de contato (fallback)

## 🧪 Executar Testes E2E

```powershell
# 1. Iniciar aplicação na porta 9005
node .vscode/start-9005.js

# 2. Em outro terminal, executar testes Playwright
npx playwright test tests/e2e/auction-contact-hierarchy.spec.ts --headed

# 3. Visualizar relatório
npx playwright show-report
```

**Testes implementados:**
1. ✅ Exibir contatos específicos do leilão (🔵)
2. ✅ Herdar contatos do leiloeiro (👤)
3. ✅ Fallback para contatos da plataforma
4. ✅ Validar links clicáveis (WhatsApp, Email, Telefone)
5. ✅ Captura de screenshot para regressão visual

## 📊 Validação Visual

1. Abrir browser: `http://demo.localhost:9005`
2. Navegar para um leilão com lote
3. Na página do lote, verificar card **"Contato e Suporte"**
4. Validar:
   - ✅ Ícones exibidos (📞, ✉️, 💬)
   - ✅ Links clicáveis funcionais
   - ✅ Badge de origem exibido corretamente:
     - 🔵 "Contato do leilão" (se Auction possui dados)
     - 👤 "Contato do leiloeiro" (se herda de Auctioneer)
     - *sem badge* (se usa fallback PlatformSettings)

## 🔄 Workflow de Pull Request

### 1. Criar Pull Request

Via GitHub CLI:
```powershell
gh pr create --title "feat: Sistema hierárquico de contatos para leilões" \
  --body "## 📝 Descrição

Sistema de contatos hierárquicos com resolução automática:
- Prioridade 1: Campos do leilão (supportPhone, supportEmail, supportWhatsApp)
- Prioridade 2: Campos do leiloeiro (supportWhatsApp)
- Prioridade 3: Campos da plataforma (fallback)

## ✅ Checklist de QA

- [x] Schema Prisma atualizado (MySQL + PostgreSQL)
- [x] Service layer com lógica de herança implementada
- [x] UI com indicadores visuais de origem
- [x] 5 testes E2E abrangentes criados
- [x] Documentação BDD completa (4 cenários Gherkin)
- [x] Seed data atualizado com dados de teste

## 🧪 Testes

\`\`\`bash
npx playwright test tests/e2e/auction-contact-hierarchy.spec.ts --headed
\`\`\`

## 📚 Documentação

- [BDD Completo](./docs/features/CADASTRO_CONTATOS_HIERARQUICO.md)
- [Resumo Executivo](./docs/features/RESUMO_IMPLEMENTACAO_CONTATOS.md)
- [Deploy Guide](./docs/features/DEPLOY_CONTATOS_HIERARQUICOS.md)

## ⚠️ Breaking Changes

Requer migração de schema:
- Auction: +3 campos (supportPhone, supportEmail, supportWhatsApp)
- Auctioneer: +1 campo (supportWhatsApp)

## 🔗 Links

- Branch: \`feat/auction-contact-hierarchy-20260212-2351\`
- Commit: \`eab893ba\`
" \
  --base main \
  --head feat/auction-contact-hierarchy-20260212-2351
```

Ou manualmente via link:
```
https://github.com/augustodevcode/bidexpert_ai_firebase_studio/pull/new/feat/auction-contact-hierarchy-20260212-2351
```

### 2. Aguardar Revisão

- ⏳ Code review por membro da equipe
- ⏳ CI/CD passar (build, tests, linting)
- ⏳ Aprovação explícita do usuário humano

### 3. Merge para Main

**🚫 NUNCA fazer merge sem autorização explícita!**

Após aprovação:
```powershell
# Via GitHub CLI
gh pr merge --merge --delete-branch

# Ou via UI do GitHub (recomendado)
```

## 📈 Monitoramento Pós-Deploy

### 1. Validar dados migrados

```sql
-- Verificar auctions com contatos
SELECT 
  id, title, 
  supportPhone, supportEmail, supportWhatsApp 
FROM Auction 
WHERE supportPhone IS NOT NULL 
   OR supportEmail IS NOT NULL 
   OR supportWhatsApp IS NOT NULL;

-- Verificar auctioneers com WhatsApp
SELECT id, name, supportWhatsApp 
FROM Auctioneer 
WHERE supportWhatsApp IS NOT NULL;
```

### 2. Verificar logs da aplicação

```powershell
# Monitorar logs em tempo real
tail -f logs/bidexpert-9005-$(Get-Date -Format 'yyyy-MM-dd').log
```

Buscar por:
- ✅ Ausência de erros `getAuctionContact`
- ✅ Queries Prisma executando sem erros
- ⚠️ Warnings de campos NULL (esperado em fallback)

### 3. Testes de Smoke em Produção

Após deploy em PROD:
1. Acessar 3 leilões diferentes
2. Verificar card de contato em cada um
3. Testar links (WhatsApp, Email, Telefone)
4. Confirmar indicadores visuais corretos

## 🔙 Rollback (Se Necessário)

### Reverter Migration

```powershell
# 1. Identificar migration anterior
npx prisma migrate status

# 2. Reverter para migration anterior
npx prisma migrate resolve --rolled-back "20260212_add_auction_contact_fields"

# 3. Aplicar migration de rollback
npx prisma migrate dev --name rollback_auction_contacts
```

### Reverter Código

```powershell
# Via Git
git revert eab893ba  # Reverte commit específico

# Ou fazer checkout da demo-stable
git checkout demo-stable
git pull origin demo-stable
```

## 📞 Suporte

**Problemas comuns:**

1. **Migration falha com shadow database**
   - Solução: Arquivar migrations antigas ou usar `db push`

2. **Campos NULL em produção**
   - Esperado: Sistema usa fallback automático
   - Verificar: PlatformSettings possui contatos configurados

3. **Links não funcionam**
   - Verificar formato dos dados (deve incluir DDD para telefone)
   - Testar em diferentes browsers

4. **Badge de origem incorreto**
   - Validar lógica em `auction-contact.service.ts`
   - Verificar hierarquia: Auction → Auctioneer → Platform

## ✅ Checklist Final de Deploy

- [ ] Migration aplicada com sucesso
- [ ] Seed executado (dados de teste criados)
- [ ] Testes E2E passaram (5/5)
- [ ] Validação visual confirmada
- [ ] Pull Request criado
- [ ] Code review aprovado
- [ ] CI/CD passou
- [ ] **Autorização de merge obtida**
- [ ] Merge para main executado
- [ ] Deploy em DEMO funcionando
- [ ] Deploy em PROD validado
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

---

**Data de criação:** 2026-02-12  
**Branch:** `feat/auction-contact-hierarchy-20260212-2351`  
**Commit:** `eab893ba`  
**Autor:** GitHub Copilot AI Assistant
