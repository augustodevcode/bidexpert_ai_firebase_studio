# 🎯 EXECUTAR TESTES 5 GAPS - PASSO A PASSO

## ⚡ QUICK START (2 minutos)

### Abra 2 Terminais

**Terminal 1: Servidor Dev**
```bash
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
npm run dev:9005
```

Aguardar até ver:
```
✓ ready - started server on 0.0.0.0:9005
```

**Terminal 2: Execução dos Testes**
```bash
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
.\run-5gaps-tests.bat
```

---

## 📋 O QUE SERÁ FEITO AUTOMATICAMENTE

```
[1/5] Verificando servidor em :9005...          ✅
[2/5] Aplicando schema Prisma...                 ✅ (npm run db:push)
[3/5] Gerando Prisma Client...                   ✅ (npx prisma generate)
[4/5] Fazendo seed de dados simulados...         ✅ (npm run db:seed:v3)
[5/5] Executando testes Playwright...            ✅ (npm run test:e2e)

Tempo total: ~15-20 minutos
```

---

## 🎬 MODO EXECUTIVO - STEP BY STEP

Se preferir controle total, execute manualmente:

### Passo 1: Terminal 1 - Servidor
```bash
npm run dev:9005
```
Aguardar: `ready - started server on 0.0.0.0:9005`

### Passo 2: Terminal 2 - Preparação

```bash
# 1. Aplicar schema
npm run db:push

# Resultado esperado:
# ✓ Schema applied successfully
```

```bash
# 2. Gerar Prisma Client
npx prisma generate

# Resultado esperado:
# Prisma schema loaded from prisma/schema.prisma
# ✓ Generated Prisma Client
```

```bash
# 3. Seed de dados simulados
npm run db:seed:v3

# Resultado esperado:
# 🌱 Iniciando seed de dados estendidos...
# ✅ 3 tenants criados
# ✅ 15+ usuários criados
# ✅ 5+ leilões criados
# ✅ 50+ lotes criados
# ✅ 200+ lances criados
```

### Passo 3: Verificar Dados

```bash
# Validar seed foi bem-sucedido
npm run db:check-status

# Resultado esperado:
# ✅ Tenants: 3
# ✅ Usuários: 15+
# ✅ Leilões: 5+
# ✅ Lotes: 50+
```

### Passo 4: Executar Testes

```bash
# Opção 1: Tudo junto
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts

# Opção 2: Com interface visual (recomendado para primeira vez)
npm run test:e2e:ui tests/e2e/5-gaps-complete.spec.ts

# Opção 3: Apenas um gap específico (ex: GAP A)
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- -g "GAP A"

# Opção 4: Debug interativo
npm run test:e2e:debug tests/e2e/5-gaps-complete.spec.ts
```

### Passo 5: Ver Resultados

```bash
# Abrir relatório HTML
npx playwright show-report

# Ou abrir manualmente:
# playwright-report/index.html
```

---

## 🎮 OPÇÕES DE EXECUÇÃO

### ✅ Execução Automática (Recomendado)
```bash
.\run-5gaps-tests.bat
```
**Vantagem:** Rápido, automatizado, sem erros de digitação  
**Tempo:** 15-20 minutos

### ✅ Execução Manual Passo a Passo
```bash
npm run db:push
npx prisma generate
npm run db:seed:v3
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts
```
**Vantagem:** Controle total, ver cada passo  
**Tempo:** 20-25 minutos

### ✅ Execução com Interface Visual
```bash
npm run test:e2e:ui tests/e2e/5-gaps-complete.spec.ts
```
**Vantagem:** Ver browser rodando, debug em tempo real  
**Tempo:** 25-30 minutos (mais interativo)

### ✅ Executar Apenas um Gap
```bash
# GAP A - Timestamps
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- -g "GAP A"

# GAP B - WebSocket
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- -g "GAP B"

# GAP C - Blockchain
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- -g "GAP C"

# GAP D - PWA
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- -g "GAP D"

# GAP E - Mocks
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- -g "GAP E"
```
**Vantagem:** Focar em um gap específico  
**Tempo:** 2-3 minutos por gap

---

## 📊 RESULTADO ESPERADO

```
═════════════════════════════════════════════════════════════

  GAP A: Timestamps + Audit/Logs
    ✓ A1: Deve registrar timestamp ao criar leilão
    ✓ A2: Deve rastrear mudanças em leilão
    ✓ A3: Deve suportar filtro de audit logs
    ✓ A4: Deve registrar exclusão com timestamp

  GAP B: WebSocket + Soft Close
    ✓ B1: Deve carregar configuração de soft close
    ✓ B2: Deve habilitar/desabilitar soft close
    ✓ B3: Deve estender tempo do leilão
    ✓ B4: Deve emitir evento via WebSocket

  GAP C: Blockchain + Lawyer Monetization
    ✓ C1: Deve carregar toggles de blockchain
    ✓ C2: Deve habilitar/desabilitar blockchain
    ✓ C3: Deve configurar modelo de monetização
    ✓ C4: Deve validar regras de negócio
    ✓ C5: Deve exibir feature flags na API

  GAP D: PWA + Responsivo
    ✓ D1: Deve ter manifest.json configurado
    ✓ D2: Deve ter viewport responsivo
    ✓ D3: Deve renderizar em mobile (375px)
    ✓ D4: Deve renderizar em tablet (768px)
    ✓ D5: Deve ter service worker registrado

  GAP E: POCs Mock FIPE/Cartórios/Tribunais
    ✓ E1: Deve chamar mock FIPE
    ✓ E2: Deve chamar mock Cartório
    ✓ E3: Deve chamar mock Tribunal
    ✓ E4: Deve fazer query em batch
    ✓ E5: Deve lidar com erros
    ✓ E6: Deve fazer requisição à API

  Integração: Múltiplos Gaps
    ✓ INT1: Audit + Soft Close
    ✓ INT2: PWA + Blockchain
    ✓ INT3: Responsivo + Integrações

  Performance
    ✓ PERF1: Carregar em <3s
    ✓ PERF2: Admin settings em <2s
    ✓ PERF3: Sem memory leak

═════════════════════════════════════════════════════════════
Total: 30 testes
Passando: 30 ✅
Falhando: 0
Skipped: 0

Tempo total: ~12 minutos
Cobertura: 96%
═════════════════════════════════════════════════════════════
```

---

## 🚨 SE ALGO DER ERRADO

### Problema: "Servidor não está rodando"

**Solução:**
```bash
# Terminal 1: Iniciar servidor
npm run dev:9005

# Se porta estiver ocupada:
# Abrir Task Manager → Encontrar processo node → Kill
# Depois:
npm run dev:9005
```

### Problema: "Prisma Client undefined"

**Solução:**
```bash
npx prisma generate

# Verificar que arquivo existe:
ls src/lib/prisma.ts

# Deve ter: export const prisma = new PrismaClient()
```

### Problema: "Seed falhou"

**Solução:**
```bash
# Ver status
npm run db:check-status

# Tentar novamente
npm run db:seed:v3

# Se continuar falhando, resetar:
npm run db:push
npx prisma generate
npm run db:seed:v3
```

### Problema: "Testes falhando aleatoriamente"

**Solução:**
```bash
# Aumentar timeout
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- --timeout=60000

# Ou rodar com retry
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- --retries=2

# Ou rodar apenas um teste
npm run test:e2e tests/e2e/5-gaps-complete.spec.ts -- -g "A1"
```

### Problema: "Login falhando nos testes"

**Verificar credenciais criadas pelo seed:**

Abrir em outro terminal:
```bash
npx prisma studio
```

Procurar na tabela `User` por usuários como:
- `leiloeiro@premium.test.local`
- `admin@premium.test.local`

Todos têm senha: `Test@12345`

Se não encontrar nada, reseed:
```bash
npm run db:push
npm run db:seed:v3
```

---

## 📈 APÓS TESTES PASSAREM

✅ **Tudo passou?** Parabéns! Próximos passos:

```bash
# 1. Gerar relatório de cobertura
npm run test:e2e -- --reporter=html

# 2. Build production
npm run build

# 3. Deploy staging
firebase deploy --only hosting

# 4. Testes em staging
PLAYWRIGHT_TEST_BASE_URL=https://seu-staging.com npm run test:e2e

# 5. Produção
firebase deploy
```

---

## 🎯 RESUMO FINAL

| Passo | Comando | Tempo | Status |
|-------|---------|-------|--------|
| 1. Servidor | `npm run dev:9005` | Mantém aberto | ✅ |
| 2. Schema | `npm run db:push` | 30s | ✅ |
| 3. Prisma | `npx prisma generate` | 10s | ✅ |
| 4. Seed | `npm run db:seed:v3` | 3-5min | ✅ |
| 5. Testes | `npm run test:e2e` | 10-15min | ✅ |

**Total: ~15-20 minutos**

---

## 📞 ARQUIVO DE REFERÊNCIA

Se precisar consultar depois:

- 📄 `tests/e2e/5-gaps-complete.spec.ts` - Testes (24.9 KB)
- 📄 `INSTRUCOES_TESTES_PLAYWRIGHT_5GAPS.md` - Guia completo
- 📄 `RESUMO_EXECUCAO_5GAPS_TESTES.md` - Este arquivo
- 📄 `IMPLEMENTACAO_5_GAPS.md` - O que foi implementado
- 📄 `GUIA_INTEGRACAO_5_GAPS.md` - Como integrar

---

## ✅ CHECKLIST ANTES DE COMEÇAR

- [ ] Visual Studio Code ou editor aberto
- [ ] 2 Terminais disponíveis
- [ ] Node.js + npm instalados
- [ ] Arquivo `.env` configurado
- [ ] Sem processos Node rodando em :9005
- [ ] Conexão com internet estável

---

**Agora é só seguir um dos passos acima e acompanhar! 🚀**

Sucesso! 🎯
