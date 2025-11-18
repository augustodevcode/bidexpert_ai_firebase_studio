# 📋 GUIA DE EXECUÇÃO DOS TESTES - CORE FEATURES

## 🎯 Objetivo
Executar suite completa de testes Playwright cobrindo os 5 gaps principais implementados:
1. Multi-tenant com isolamento de dados
2. Lances automáticos parametrizados
3. Analytics e monitoramento em tempo real
4. Auditoria granular com soft delete
5. Cards de lote com informações do leilão

---

## 📋 PRÉ-REQUISITOS

### 1. Dependências Instaladas
```bash
npm install
# ou
yarn install
```

### 2. Variáveis de Ambiente
Garantir que `.env` contém:
```env
DATABASE_URL="sua-url-do-banco"
BASE_URL="http://localhost:9005"
NODE_ENV="test"
NEXT_PUBLIC_FIREBASE_CONFIG="{...}"
```

### 3. Banco de Dados Pronto
O banco deve estar acessível e com migrations aplicadas:
```bash
npx prisma db push
```

---

## 🚀 PASSO 1: Popular Banco com Dados de Teste

Executar o seed extendido V3 que já contém todas as implementações:

```bash
npm run db:seed:v3
```

### O que o Seed V3 Popula:
- ✅ **Tenants** (tenant-001, tenant-002) com configurações diferentes
- ✅ **Usuários** com múltiplos roles (leiloeiro, comprador, operador)
- ✅ **Leilões** com lances automáticos habilitados
- ✅ **Lotes** com informações ligadas aos leilões
- ✅ **Lances** simulando comportamento real
- ✅ **Logs de Auditoria** para todos os eventos
- ✅ **Analytics** pré-inicializados

**Tempo esperado:** ~2-3 minutos

**Saída esperada:**
```
🌱 Iniciando seed de dados estendidos...
📦 Criando tenants...
✅ 2 tenants criados
👥 Criando usuários com múltiplos roles...
✅ 15 usuários criados
🏛️ Criando leilões com parâmetros automáticos...
✅ 5 leilões criados
🎴 Criando lotes...
✅ 20 lotes criados
💰 Criando lances...
✅ 100 lances criados
📊 Registrando eventos de auditoria...
✅ 125 registros de auditoria criados
✨ Seed concluído com sucesso!
```

---

## 🧪 PASSO 2: Iniciar Servidor de Desenvolvimento

Em um terminal separado, iniciar o servidor:

```bash
npm run dev:9005
```

**Aguardar até aparecer:**
```
ready - started server on 0.0.0.0:9005, url: http://localhost:9005
```

---

## 🎭 PASSO 3: Executar Testes Playwright

### Opção A: Executar Todos os Testes (Recomendado)
```bash
npm run test:e2e
```

### Opção B: Modo UI (Visual)
Para ver os testes rodando em tempo real:
```bash
npm run test:e2e:ui
```

### Opção C: Modo Debug
Para debugar testes específicos:
```bash
npm run test:e2e:debug
```

### Opção D: Teste Específico
```bash
# Testar apenas multi-tenant
npx playwright test tests/e2e/core-features.spec.ts --grep "Multi-tenant"

# Testar apenas lances automáticos
npx playwright test tests/e2e/core-features.spec.ts --grep "Lances Automáticos"

# Testar apenas auditoria
npx playwright test tests/e2e/core-features.spec.ts --grep "Auditoria"
```

---

## 📊 PASSO 4: Verificar Resultados

Após execução, verificar:

### 1. Relatório de Testes
```bash
# Abrir relatório HTML
npx playwright show-report
```

### 2. Arquivo de Log
```
test-results/plaintext-report.txt
```

### 3. Evidências (Screenshots/Videos)
```
playwright-report/
├── index.html
├── data/
├── screenshots/
└── videos/
```

---

## ✅ CHECKLIST DE EXECUÇÃO

### Antes de Começar
- [ ] Node.js e npm instalados
- [ ] Repositório clonado e `cd` no diretório
- [ ] `.env` configurado corretamente
- [ ] Porta 9005 disponível

### Execução
- [ ] `npm install` ✓
- [ ] `npm run db:seed:v3` ✓
- [ ] Aguardar conclusão do seed (mensagem de sucesso)
- [ ] `npm run dev:9005` em terminal separado ✓
- [ ] Aguardar "ready - started server"
- [ ] `npm run test:e2e` ✓

### Validação
- [ ] Todos os testes passando (verde)
- [ ] Nenhum timeout
- [ ] Relatório HTML acessível
- [ ] Screenshots de falhas (se houver)

---

## 🐛 TROUBLESHOOTING

### Erro: "Porta 9005 já em uso"
```bash
# Encontrar e matar processo
netstat -ano | findstr :9005
taskkill /PID <PID> /F

# Ou usar porta diferente
npm run dev:9003
# E atualizar BASE_URL no .env
```

### Erro: "Banco de dados não conecta"
```bash
# Verificar string de conexão
echo $DATABASE_URL

# Resetar banco
npx prisma db push --force-reset
npm run db:seed:v3
```

### Erro: "Timeout nos testes"
- Aumentar timeout no `playwright.config.local.ts`
- Verificar performance da máquina
- Reduzir número de workers (atual: 1)

### Erro: "Autenticação falha"
- Verificar token em `tests/e2e/.auth/admin.json`
- Executar setup novamente: `npx playwright test --setup`

### Teste Encontra Elemento, mas Não Clica
- Adicionar `waitForLoadState()`:
```typescript
await page.waitForLoadState('networkidle');
await page.click('[data-testid="btn-salvar"]');
```

---

## 📈 MÉTRICAS ESPERADAS

### Cobertura de Testes
- **Total de cenários:** 30+
- **Taxa de sucesso esperada:** 100%
- **Tempo total esperado:** ~5-10 minutos

### Gaps Cobertos
| Gap | Testes | Situação |
|-----|--------|----------|
| Multi-tenant | 4 | ✅ Coberto |
| Lances Automáticos | 5 | ✅ Coberto |
| Analytics | 6 | ✅ Coberto |
| Auditoria | 5 | ✅ Coberto |
| Cards Lote | 6 | ✅ Coberto |
| Integração | 2 | ✅ Coberto |

---

## 🔍 VERIFICAÇÕES TÉCNICAS

### 1. Validar Isolamento Multi-tenant
```bash
curl -H "X-Tenant-ID: tenant-001" http://localhost:9005/api/leiloes
# Deve retornar apenas leilões do tenant-001
```

### 2. Validar Lances Automáticos
```bash
# Verificar no banco
sqlite3 bidexpert.db
> SELECT * FROM lance WHERE automatico = true LIMIT 5;
```

### 3. Validar Analytics
```bash
# Checar se eventos estão sendo registrados
curl http://localhost:9005/api/analytics/eventos?limit=10
```

### 4. Validar Auditoria
```bash
# Verificar logs de auditoria
curl http://localhost:9005/api/auditoria?acao=CREATE&limit=10
```

### 5. Validar Soft Delete
```bash
# No banco, verificar campo deletedAt
sqlite3 bidexpert.db
> SELECT id, titulo, deletedAt FROM lote WHERE deletedAt IS NOT NULL;
```

---

## 📝 ESTRUTURA DOS TESTES

```
tests/
├── e2e/
│   ├── core-features.spec.ts          ← TESTES PRINCIPAIS
│   ├── global-setup.ts                ← Setup global
│   └── .auth/
│       └── admin.json                 ← Credenciais de teste
├── fixtures/
│   ├── test-data.ts                   ← Dados de teste
│   └── mock-data.ts                   ← Mocks
└── utils/
    ├── test-helpers.ts                ← Funções auxiliares
    └── assertions.ts                  ← Assertions customizadas
```

---

## 🎯 O QUE CADA SEÇÃO DE TESTES VALIDA

### 🏢 GAP 1: Multi-tenant
- Isolamento de dados por tenant
- Aplicação de config por tenant
- Bloqueio de acesso cruzado
- Queries isoladas

### 🤖 GAP 2: Lances Automáticos
- Toggle no cadastro
- Salvamento de parâmetros
- Execução durante leilão
- Respeito a limites

### 📊 GAP 3: Analytics
- Dashboard visível
- Métricas em tempo real
- Gráficos carregando
- Registro de falhas
- WebSocket funcionando

### 🔍 GAP 4: Auditoria
- Log completo visível
- Registro de ações
- Soft delete mantém histórico
- Quem/quando/por que
- Múltiplos roles auditados
- Restauração possível

### 🎴 GAP 5: Cards Lote
- Informações básicas visíveis
- Informações do leilão aparecem
- Status do leilão exibido
- Componente universal usado
- Atualizações em tempo real
- Consistência entre visualizações

---

## 🚀 EXECUÇÃO RÁPIDA (Resumido)

Para quem quer apenas rodar rápido:

```bash
# Terminal 1
npm install
npm run db:seed:v3
npm run dev:9005

# Terminal 2
npm run test:e2e
```

Aguardar 5-10 minutos e verificar relatório em `playwright-report/index.html`

---

## 📞 REFERÊNCIAS

- **Playwright Docs:** https://playwright.dev
- **Config:** `playwright.config.local.ts`
- **Package.json:** Seção `scripts`
- **GitHub:** Consultar ações em `.github/workflows`

---

## ✨ PRÓXIMOS PASSOS APÓS SUCESSO

1. ✅ Testes passando localmente
2. → Commitar seed data gerada
3. → CI/CD executará automaticamente
4. → Monitorar cobertura de testes
5. → Expandir para mais cenários
6. → Integração contínua

---

**Data de Criação:** 2025-11-14  
**Versão:** 1.0  
**Status:** 🟢 Pronto para Execução
