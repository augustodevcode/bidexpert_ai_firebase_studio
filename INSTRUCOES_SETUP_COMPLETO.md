# 🚀 Setup Completo: Prisma + Seed + Playwright Tests

## 📋 Checklist Rápido (5-10 minutos)

```bash
# 1. Gerar Prisma Client
npx prisma generate

# 2. Sincronizar BD
npx prisma db push

# 3. Popular dados de teste
npx ts-node --transpile-only prisma/seed-data-extended-v3.ts

# 4. Limpar cache
rmdir /s /q node_modules\.prisma
npm install

# 5. Terminal 1: Dev Server
npm run dev

# 6. Terminal 2: Testes (aguardar "Ready in Xs" do passo 5)
npm run test:e2e:realtime
```

---

## 🔍 DETALHAMENTO TÉCNICO

### PASSO 1: Gerar Prisma Client

**Comando:**
```bash
cd E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
npx prisma generate
```

**Saída esperada:**
```
Prisma schema validated ✓
Generated Prisma client to ./node_modules/@prisma/client in 1.23s
```

**Arquivos gerados/atualizados:**
- `node_modules/@prisma/client/index.d.ts` - Type definitions
- `node_modules/@prisma/client/runtime/` - Client runtime
- `.next/generated/@prisma/client/` - Next.js cache

**O que faz:**
- Lê `prisma/schema.prisma`
- Gera tipos TypeScript para todos os modelos
- Cria métodos de query (findMany, create, update, delete, etc)
- Valida schema syntax

---

### PASSO 2: Sincronizar Banco de Dados

**Comando:**
```bash
npx prisma db push
```

**Saída esperada:**
```
The database is now in sync with your Prisma schema.
✓ Created table `User`
✓ Created table `Tenant`
✓ Created table `LotCategory`
✓ Created table `Lot`
✓ Created table `Auction`
✓ Created table `Bid`
✓ Created table `AuditLog`
(e mais tables...)
```

**Verificação:**
```bash
# Checar conexão MySQL
mysql -h localhost -u root -p -e "SHOW TABLES;" bidexpert_db
```

**Tabelas criadas:**
- `User` - Usuários (admin, leiloeiro, comitente, tribunal)
- `Tenant` - Tenants/Organizações
- `LotCategory` - Categorias de lotes
- `Lot` - Lotes/Bens
- `Auction` - Leilões/Eventos
- `Bid` - Lances
- `AuditLog` - Registro de ações
- `PlatformSettings` - Configurações
- (Mais 10+ tabelas)

---

### PASSO 3: Popular Dados de Teste

**Script:** `prisma/seed-data-extended-v3.ts`

**Comando:**
```bash
npx ts-node --transpile-only prisma/seed-data-extended-v3.ts
```

**Saída esperada:**
```
🌱 Iniciando seed-data-extended-v3...

✅ Tenant criado: BidExpert Tenant (ID: 1)
✅ 5 Categorias criadas
✅ 10 Leilões criados
✅ 30 Lotes criados
✅ 50 Lances simulados
✅ 4 Usuários de teste criados
✅ 100+ Audit logs gerados

📊 Resumo:
- Tenants: 1
- Categorias: 5
- Leilões: 10 (3 SCHEDULED, 4 LIVE, 3 CLOSED)
- Lotes: 30
- Lances: 50
- Usuários: 4
- AuditLogs: 100+

Seed concluído! ✓
```

**Dados criados:**

| Tipo | Quantidade | Detalhes |
|------|-----------|----------|
| Tenants | 1 | BidExpert Tenant (ID: 1) |
| Categorias | 5 | Imóveis, Veículos, Eletrônicos, Móveis, Outros |
| Leilões | 10 | 3 SCHEDULED, 4 LIVE, 3 CLOSED |
| Lotes | 30 | Distribuídos entre as categorias |
| Lances | 50+ | Simulados com diferentes valores |
| Usuários | 4 | admin, leiloeiro, comitente, tribunal |
| AuditLogs | 100+ | CREATE, UPDATE, DELETE, BID, CLOSE |

**Credenciais de teste:**
```
Email: admin@bidexpert.com        | Senha: senha123 | Role: ADMIN
Email: leiloeiro@bidexpert.com    | Senha: senha123 | Role: LEILOEIRO
Email: comitente@bidexpert.com    | Senha: senha123 | Role: COMITENTE
Email: tribunal@bidexpert.com     | Senha: senha123 | Role: TRIBUNAL
```

---

### PASSO 4: Limpar Cache do Prisma

**Comando:**
```bash
# Windows
rmdir /s /q node_modules\.prisma

# Linux/Mac
rm -rf node_modules/.prisma
```

**Depois:**
```bash
npm install
```

**Por que fazer:**
- Remove arquivos `.tmp` que podem estar travados
- Regenera query engine native
- Resolve problemas de "EPERM" (permission denied)

---

### PASSO 5: Iniciar Dev Server

**Terminal 1:**
```bash
npm run dev
# ou
npm run dev:9005
```

**Aguardar:**
```
✓ Ready in 2.34s
```

**Verificar:**
```bash
# Em outro terminal
curl http://localhost:3000/
# Deve retornar HTML da página

curl http://localhost:3000/admin/dashboard
# Deve retornar 200 (não 500)
```

**Sem erros esperados:**
- ❌ "Cannot read properties of undefined (reading 'lotCategory')"
- ❌ "Error: Falha ao verificar/criar tenant"
- ❌ "[PlatformSettingsService] Erro ao verificar/criar tenant"
- ✅ "Ready in Xs"

---

### PASSO 6: Executar Testes Playwright

**Terminal 2:**
```bash
npm run test:e2e:realtime
```

**Ou customizado:**
```bash
npx playwright test tests/e2e/realtime-features.spec.ts --config=playwright.config.local.ts
```

**Saída esperada:**
```
Running 14 tests using 1 worker

✓ 1.1: Login com credenciais admin (2.3s)
✓ 1.2: Logout funciona corretamente (1.1s)
✓ 1.3: Acesso não autenticado redireciona (0.9s)
✓ 2.1: Dashboard carrega com KPIs (2.1s)
✓ 2.2: Gráficos renderizam (1.8s)
... (mais 9 testes)

14 passed (45.2s)
```

**Relatórios:**
```bash
npx playwright show-report
# Abre dashboard HTML com detalhes, screenshots, videos
```

---

## 🛠️ TROUBLESHOOTING

### Erro: "Cannot read properties of undefined (reading 'lotCategory')"

**Causa:** Prisma client não gerado
**Solução:**
```bash
npx prisma generate
npx prisma db push
npm install
```

### Erro: "EPERM: operation not permitted"

**Causa:** .prisma lock file
**Solução:**
```bash
# Fechar IDEs, VS Code, antivírus
taskkill /F /IM node.exe
taskkill /F /IM npm.exe
# Ou: Restart do PC

rmdir /s /q node_modules\.prisma
npm install
```

### Erro: "Error: Falha ao verificar/criar tenant"

**Causa:** Banco desconectado ou .env incorreto
**Solução:**
```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Testar conexão MySQL
mysql -h localhost -u root -p -e "SELECT 1;"

# Se BD não existe:
npx prisma db push
```

### Erro: "Timeout waiting 120000ms from config.webServer"

**Causa:** Dev server não levanta em 120 segundos
**Solução:**
```bash
# Limpar build cache
rm -rf .next

# Rodar dev manualmente
npm run dev

# Aguardar "Ready in Xs"

# Em outro terminal
npm run test:e2e:realtime
```

### Erro: "no tests found"

**Causa:** Arquivo de teste não existe
**Solução:**
```bash
# Verificar arquivo
ls tests/e2e/realtime-features.spec.ts

# Se não existe, copiar do template
cp tests/e2e/complete-features.spec.ts tests/e2e/realtime-features.spec.ts
```

---

## 📊 Verificação de Saúde do Sistema

### Checklist pré-teste

Executar:
```bash
# 1. Prisma gerado?
ls node_modules/@prisma/client/index.d.ts
# Esperado: arquivo existe

# 2. Banco sincronizado?
npx prisma db push --skip-generate
# Esperado: "Database is now in sync"

# 3. Dados populados?
npx prisma studio
# Abre UI interativa para verificar dados

# 4. Env configurado?
cat .env | grep -E "DATABASE_URL|NEXTAUTH"
# Esperado: URLs e keys presentes

# 5. Dev server funciona?
npm run dev &
sleep 5
curl http://localhost:3000/admin/dashboard
kill %1
# Esperado: status 200
```

---

## 📈 Cenários de Teste

### 1️⃣ Teste Unitário (Rápido)
```bash
npm run test:unit
# ~2 minutos
```

### 2️⃣ Teste E2E Realtime (Completo)
```bash
npm run test:e2e:realtime
# ~15 minutos
```

### 3️⃣ Teste Completo (Full Suite)
```bash
npm run test:all
# ~30 minutos
```

---

## 🔐 Informações Sensíveis

### Variáveis de Ambiente Necessárias

**.env.local:**
```
DATABASE_URL="mysql://root:senha@localhost:3306/bidexpert_db"
NEXTAUTH_SECRET="seu-secret-aleatorio-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### Não commitar:
- `.env.local`
- `node_modules/.prisma`
- `.next/`

---

## 📚 Referências

| Arquivo | Propósito |
|---------|-----------|
| `prisma/schema.prisma` | Definição do banco de dados |
| `prisma/seed-data-extended-v3.ts` | Script de população |
| `playwright.config.local.ts` | Configuração de testes |
| `tests/e2e/realtime-features.spec.ts` | Suite de testes |
| `src/lib/prisma.ts` | Cliente Prisma singleton |
| `src/services/platform-settings.service.ts` | Serviço de configurações |

---

## ⏱️ Timeline Estimado

| Etapa | Tempo | Crítico |
|-------|-------|---------|
| Gerar Prisma | 30s | ✅ Sim |
| Sincronizar BD | 20s | ✅ Sim |
| Seed dados | 2min | ✅ Sim |
| Limpar cache | 1min | ⚠️ Às vezes |
| Dev server inicia | 3min | ✅ Sim |
| Testes rodando | 15min | ✅ Sim |
| **TOTAL** | **~22min** | |

---

## 🎯 Success Criteria

- ✅ 0 erros de Prisma em logs
- ✅ Dados aparecem no `prisma studio`
- ✅ `/admin/dashboard` carrega (200 OK)
- ✅ 14 testes Playwright passam
- ✅ WebSocket conecta (WebSocket 101)
- ✅ Audit logs registram ações

---

**Status:** Pronto para execução
**Data:** 2025-11-14
**Atualização:** Após execução manual dos passos
