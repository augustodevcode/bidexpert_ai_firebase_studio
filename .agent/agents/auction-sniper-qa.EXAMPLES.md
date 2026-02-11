# 🕵️ Auction Sniper & QA - Real-World Examples

**Exemplos Prontos para Copy-Paste** | **Casos Reais** | **Respostas Esperadas**

---

## 📝 Example 1: Bug Crítico - Bid Duplicado

### Situação
Um usuário reportou que conseguiu dar 2 lances no mesmo lote em menos de 1 segundo, gerando 2 transações.

### Request Pronto (Copy-Paste)

```markdown
🕵️ Auction Sniper & QA - CRITICAL BUG REPORT

**Tarefa**: Investigar e corrigir bid duplicado

**Blocos a validar**: 
- [x] 5-Security (Race Condition, Double-click Shield)
- [x] 6-BDD Testing (Gherkin scenario)

**Arquivo Afetado**: 
src/app/api/auctions/[id]/bid/route.ts
src/components/LotPage/BidButton.tsx

**Context**: 
- User clicou BID 2x em < 1s
- Ambos os requests completaram
- Database mostra 2 bids para o mesmo user no mesmo lote
- 2 transações foram debitadas

**Exigências**:
- [ ] Stack trace: por que double-click shield não bloqueou?
- [ ] Proof: validação server-side existe?
- [ ] Gherkin scenario: "User sniping 2x em <1s"
- [ ] Test: E2E Playwright reproduz o bug
- [ ] Fix: bloqueio permanente com database constraint

**Tone**: CRÍTICO. Perda financeira. Sem tolerância.
```

### Resposta Esperada do Agent
O agent vai:
1. ✅ Analysar o arquivo e encontrar o gap (falta de constraint)
2. ✅ Exigir proof de sincronização (timestamps)
3. ✅ Propor Gherkin scenario
4. ✅ Code diff com constraint + teste
5. ✅ Checklist pré-deploy

---

## 📝 Example 2: Feature Novo - Filtro de Deságio

### Situação
Você está implementando um novo filtro que permite buscar por "Deságio > 30%" e quer validar que a lógica está 100% correta.

### Request Pronto

```markdown
🕵️ Auction Sniper & QA - NEW FEATURE: Discount Filter

**Tarefa**: Validar implantação de filtro de deságio

**Blocos a validar**:
- [x] 1-Search (Filtro de Deságio, precisão)
- [x] 2-UI (Conversão, clarity)
- [x] 5-Security (Input validation, performance)

**Arquivo(s)**:
- src/components/AuctionFilters/DiscountFilter.tsx
- src/lib/auction-search.service.ts
- src/validators/discount-filter.validator.ts

**Context**:
Implementei:
1. Input field: "Deságio mínimo (%)"
2. Backend logic: Calcula `(avaliacao - lanceMaior) / avaliacao * 100`
3. Filter applied na busca

**Test data**:
- Lote 1: Avaliação R$100k, Lance R$70k → Deságio 30% ✅
- Lote 2: Avaliação R$100k, Lance R$50k → Deságio 50% ✅
- Edge case: Avaliação R$100k, Lance R$100k → Deságio 0% 
- Edge case: Lance R$0 (nenhum lance ainda) → Como calcular?

**Exigências**:
- [ ] Fórmula 100% precisa (testar com 10 valores diferentes)
- [ ] Edge cases: dividir por zero prevented?
- [ ] Performance: filtro aplicado em < 1s (10k lotes)
- [ ] Persistência: se mudar página, filtro mantém?
- [ ] Acessibilidade: screen reader ler field?
- [ ] BDD Gherkin para "usuário filtra por deságio"

**Tone**: Crítico. Não tolero "parece funcionar". Exija prova numérica.
```

### Resposta Esperada
1. ✅ Validação matemática da fórmula
2. ✅ Teste de edge cases com valores específicos
3. ✅ Performance profiling (< 1s?)
4. ✅ Gherkin scenario com dados reais
5. ✅ Checklist de persistência
6. ✅ Accessibility va

lidation

---

## 📝 Example 3: Bug de Performance - Dashboard Lento

### Situação
Usuário com 500+ lances ativos reporta que dashboard demora 8 segundos para carregar. Target é 2.5s (LCP).

### Request Pronto

```markdown
🕵️ Auction Sniper & QA - PERFORMANCE BUG: Dashboard Slow

**Tarefa**: Diagnosticar e fixar dashboard latency (8s → 2.5s)

**Blocos a validar**:
- [x] 4-Dashboard (WebSocket, data loading)
- [x] 5-Security (Query optimization, N+1 queries)

**Arquivo(s)**:
- src/app/[tenantId]/dashboard/page.tsx
- src/components/Dashboard/PortfolioPanel.tsx
- src/app/api/user/portfolio/route.ts (API)

**Metrics**:
Current:
- LCP (Largest Contentful Paint): 8.2s ❌
- FID (First Input Delay): 450ms ❌
- CLS (Cumulative Layout Shift): 0.15 ⚠️

Target:
- LCP: < 2.5s ✅
- FID: < 100ms ✅
- CLS: < 0.1 ✅

**Context**:
- User com 500+ lances ativos
- Dashboard renderiza tudo de uma vez (não lazy loads)
- API call leva 5s (N+1 queries suspected)
- WebSocket updates causam full re-render

**Exigências**:
- [ ] Chrome DevTools profiling: cite o bottleneck (DB, render, network)
- [ ] N+1 query analysis: quantas queries rodando?
- [ ] Lazy load strategy: abordagem proposta
- [ ] Granular updates: estruturar WebSocket sem full re-render
- [ ] Gherkin: "Dashboard com 500 bids loads em < 2.5s"
- [ ] Before/after metrics

**Tone**: Crítico. Performance degradation = compliance failure.
```

### Resposta Esperada
1. ✅ Chrome DevTools snapshot + análise
2. ✅ N+1 query fix (indíces, joins)
3. ✅ Lazy load strategy (virtualization, pagination)
4. ✅ WebSocket granular updates (não full re-render)
5. ✅ Code diff com otimizações
6. ✅ Benchmark before/after

---

## 📝 Example 4: Code Review - Função Crítica de Cálculo ROI

### Situação
Dev abriu PR com função que calcula ROI do investidor. Você quer validar antes de merge.

### Request Pronto

```markdown
🕵️ Auction Sniper & QA - CODE REVIEW: ROI Calculator

**Tarefa**: Code review da função de cálculo de ROI

**Blocos a validar**:
- [x] 3-Lot Page (ROI Calc, precisão)
- [x] 5-Security (Input validation, rounding errors)
- [x] 6-BDD (Test cases)

**Arquivo**: src/lib/roi-calculator.ts

**PR Link**: #1234

**Context**:
Dev implementou função que calcula:
```typescript
const roi = ((salePrice - (bidAmount + fees + taxes)) / bidAmount) * 100
```

**Math validation needed**:
- Bid amount: R$100k
- Fees: 5% = R$5k
- Taxes (IRPF): 15% of profit
- Sale Price: R$180k
- Expected ROI: ???

Calculate manually:
- Gross profit: 180k - 100k = 80k
- Taxes: (80k * 15%) = 12k
- Fees: 5k
- Net profit: 80k - 12k - 5k = 63k
- ROI %: (63k / 100k) * 100 = 63%

**Exigências**:
- [ ] Fórmula matches cálculo manual acima (63%)?
- [ ] Edge case: bid = sale price → ROI = -5% (fees)?
- [ ] Edge case: sale < bid → Negative ROI?
- [ ] Rounding: até 2 decimais (não float imprecision)?
- [ ] Unit tests: mínimo 10 casos de teste
- [ ] Input validation: bid > 0, sale > 0?

**Tone**: Crítico. ROI incorreto = investidor faz bad decisions.
```

### Resposta Esperada
1. ✅ Validação matemática manual
2. ✅ Identificação de bugs (se houver)
3. ✅ Edge case coverage
4. ✅ Unit test suggestions
5. ✅ Code diff corrections
6. ✅ Green flag ou "Request changes"

---

## 📝 Example 5: E2E Test Creation - Sniping Scenario

### Situação
Você precisa escrever um E2E test que simula um usuário fazendo snipe nos últimos 10 segundos (critical path).

### Request Pronto

```markdown
🕵️ Auction Sniper & QA - E2E TEST: Late Bidding (Sniping)

**Tarefa**: Escrever teste Playwright para sniping nos últimos 10s

**Blocos a validar**:
- [x] 5-Security (Race condition, timestamp sync)
- [x] 6-BDD (Gherkin scenario first)

**Arquivo a criar**: tests/e2e/auction-sniping.spec.ts

**Gherkin Scenario**:
```gherkin
Scenario: User snipes in final 10 seconds
  Given an auction ending in 10 seconds
    And auction is in open bidding stage  
    And user is viewing the lot page
    And current highest bid is R$100k
  When user places bid of R$110k with 8 seconds remaining
    And another user attempts to bid R$115k with 5 seconds remaining  
  Then both bids should be registered (no loss of data)
    And timestamps should sync with server (< 100ms diff)
    And audit log should show both bids with exact times
    And no race condition or duplicate bids
    And user sees immediate confirmation (< 300ms)
```

**Test Conditions**:
- Network condition: Slow 3G (para simular real-world latency)
- Simulated server latency: +100ms
- Concurrent bidders: 2-3 simultâneos no mesmo lote

**Exigências**:
- [ ] Test reproduz scenario acima
- [ ] Validates race condition prevention
- [ ] Checks audit log entries
- [ ] Validates timestamp sync (< 100ms)
- [ ] Takes screenshot at critical moments
- [ ] Assertions: bid count, amounts, timestamps

**Tone**: Crítico. Sniping é high-value transaction. Zero tolerance for race conditions.
```

### Resposta Esperada do Agent
```typescript
// Playwright test code completo
// Com setup, assertions, cleanup
// BDD structure clara
// Screenshot capture points
// Error handling robusto
```

---

## 📋 Template Blank (Copy-Paste Para Usar)

```markdown
🕵️ Auction Sniper & QA - [TYPE: BUG/FEATURE/REVIEW/TEST]

**Tarefa**: [1 linha clara]

**Blocos a validar**:
- [ ] 1-Search
- [ ] 2-UI/UX
- [ ] 3-Lot Page
- [ ] 4-Dashboard
- [ ] 5-Security
- [ ] 6-BDD Testing
- [ ] 7-Tone

**Arquivo(s)**: [paths]

**Context**: 
[Descrição do caso]

**Exigências**:
- [ ] [Primeira exigência]
- [ ] [Segunda exigência]
- [ ] [Terceira exigência]

**Tone**: [Crítico/Brainstorm/Balanced]
```

---

## 🎯 Summary: Como Usar Esses Exemplos

1. **Escolha seu caso** (Bug, Feature, Review, Test, Perf)
2. **Copy-paste** o template apropriado
3. **Replace [placeholders]** com seus valores específicos
4. **Envie** para o agent via runSubagent ou chat
5. **Obtenha** resposta em < 5 minutos com proof exigida

---

**Version**: 1.0.0 | **Last Update**: 7/02/2026 | **Status**: ✅ Ready to Use
