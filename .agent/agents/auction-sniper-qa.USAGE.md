# 🕵️ Auction Sniper & QA Agent - Instrução de Uso para Modelos IA

**Versão**: 1.0.0  
**Data**: 7 de Fevereiro de 2026  
**Aplicável a**: GitHub Copilot, Cursor, Gemini e todos os modelos IA no VSCode

---

## 📖 Overview

Este documento descreve COMO e QUANDO invocar o agent **Auction Sniper & QA Architect** quando você está trabalhando em tarefas relacionadas a:

- **Leilões** (auctions): bidding, search, filters, lot pages
- **Investimento/Carteira**: dashboard, ROI, performance metrics  
- **Segurança Financeira**: race conditions, concurrency, audit trails
- **UX/Conversão**: cards, banners, gatilhos mentais
- **Performance**: latency, real-time sync, WebSocket

---

## 🎯 Quando Invocar Este Agent

### Categoria 1: **CRÍTICO** (Sempre Invocar)
Quando você estiver trabalhando com:
- [ ] Lógica de bidding (criar, validar, confirmar lance)
- [ ] Cálculo de ROI ou deságio
- [ ] Fluxo de múltiplos lances simultâneos (race conditions)
- [ ] Sincronização servidor-cliente em tempo real
- [ ] Audit trail ou compliance
- [ ] Segurança financeira ou prevenção de fraude

**Action**: Use `runSubagent` ou invoke diretamente:
```
🕵️ Auction Sniper Mode: Estou implementando [descrição].
Protocol: Blocos [1-5]. Exija segurança financeira + sincronização.
```

### Categoria 2: **IMPORTANTE** (Recomendado Invocar)
Quando você estiver trabalhando com:
- [ ] Search/filter de leilões (deságio, geolocalização, persistência)
- [ ] UI/UX de cards de lote ou banners
- [ ] Dashboard de investidor (carteira, KYC, histórico)
- [ ] Performance optimization (latency > 500ms)
- [ ] Acessibilidade em fluxos de bidding
- [ ] Testes E2E ou QA para features de leilão

**Action**: Invoque ou mencione no contexto:
```
🕵️ SA-QA Review: [descrição]. Validar padrão [UI/Security/Performance].
```

### Categoria 3: **OPCIONAL** (Use Se Necessário)
Quando você estiver trabalhando com:
- [ ] Features tangenciais de leilão (notificações, relatórios)
- [ ] Refactoring de código legacy sem lógica crítica
- [ ] Brainstorm competitivo (Amazon, eBay patterns)
- [ ] Training ou documentação de padrões

**Action**: Menção casual é OK:
```
💡 Ideias: [pergunta]. Baseado em padrões de [plataforma].
```

---

## 🚀 Como Invocar (3 Métodos)

### Método 1: Direct Mention (Chat Simples)
```
Escrevendo seu request no chat, comece com:

"🕵️ Auction Sniper & QA: [sua pergunta/tarefa].
Protocolo: [Bloco X ou número].
Tom: Crítico, sem tolerância para aproximações."
```

**Exemplo**:
```
🕵️ Auction Sniper & QA: Estou implementando validação de bid.
Protocolo: Blocos 5 (Security) + 6 (BDD Testing).
Tom: Crítico. Exija race condition prevention + audit log.
```

### Método 2: SubAgent (Best for Complex Tasks)
```powershell
# No terminal ou em um task runner:
runSubagent {
  "agentName": "auction-sniper-qa",
  "prompt": "Auditar fluxo completo de bidding em [arquivo/componente].
Por favor valide: 
- Sincronização servidor/cliente (Bloco 5)
- Scenarios BDD críticos (Bloco 6)
- Performance (< 2s bid latency)
- Audit trail"
}
```

**Quando usar**: Tarefas que exigem análise profunda, múltiplos blocos, ou revisão de código existente.

### Método 3: Custom Instructions (Permanent Setup)
Se você quer que TODOS os modelos IA usem este agent automaticamente:

**Para GitHub Copilot**:
1. Settings → Copilot → Custom Instructions
2. Cole o conteúdo de `auction-sniper-qa.agent.md`
3. Marque como "Sistema"

**Para Cursor**:
1. `.cursor/rules` → Add new rule
2. Nome: "Auction Sniper QA"
3. Cole content de `.agent.md`
4. Apply to all files in project

---

## 📋 Protocolo de Invocação (Passo-a-Passo)

### Step 1: Identifique o Bloco Aplicável
Cada bloco do agent cobre um aspecto:

| Bloco | Foco | Use quando... |
|-------|------|---------|
| **1** | Search/Filters | Implementando busca, filtros, deságio |
| **2** | UI/UX Cards | Desenhando cards, banners, conversão |
| **3** | Lot Page | Página detalhes, ROI, Street View |
| **4** | Dashboard | Carteira, KYC, calendário, metrics |
| **5** | Security | Race conditions, audit, sync, session |
| **6** | BDD Testing | Escrevendo Gherkin, cenários críticos |
| **7** | Tone | Quando você quer tom crítico sem compromisso |

### Step 2: Formule o Request Claro
Sempre inclua:
- **O quê**: Feature ou código específico
- **Blocos**: Quais partes do protocolo validar (ex: 1,5,6)
- **Contexto**: Arquivo, componente, ou fluxo
- **Tone**: Crítico (default) ou brainstorm?

### Step 3: Aguarde e Processe Resposta
O agent vai:
1. Validar contra protocolo dos blocos escolhidos
2. Exigir provas de sincronização/segurança
3. Sugerir Gherkin scenarios
4. Não aceitar "aproximações"

---

## 📝 Template de Request (Copy-Paste)

```markdown
🕵️ Auction Sniper & QA Request

**Tarefa**: [descrição 1-2 linhas]

**Blocos a validar**: 
- [ ] 1-Search/Filters
- [ ] 2-UI/UX
- [ ] 3-Lot Page
- [ ] 4-Dashboard
- [ ] 5-Security
- [ ] 6-BDD
- [ ] 7-Tone

**Arquivo/Componente**: [path]

**Context**: 
- [descrição do que está fazendo]
- [desafio específico]

**Exigências**:
- [ ] Prova de sincronização (< 100ms)
- [ ] Audit trail completo
- [ ] Cenários BDD para críticos
- [ ] Zero race conditions
- [ ] Performance < 500ms

**Tone**: Crítico, sem tolerar "parece correto"
```

---

## 🔥 Exemplos de Request Reais

### Example 1: Bug em Bidding
```
🕵️ Auction Sniper & QA: USER REPORT - Lance duplicado!
Arquivo: src/app/api/auctions/[id]/bid/route.ts

Blocos: 5 (Security/Race Condition), 6 (BDD Test)

Context: Usuário deu lance 2x no mesmo lote em < 1s.
Sistema aceitou ambos, duplicando o bid.

Exigências:
✓ Stack trace de onde falhou a validação
✓ Proof de double-click shield
✓ Gherkin scenario para "sniping duplication"
✓ Teste E2E que reproduz o bug

Tone: CRÍTICO. Não aceite "parece funcionar".
```

### Example 2: Feature Nova de Search
```
🕵️ Auction Sniper & QA: Nova feature de filtro de deságio
Arquivo: src/components/AuctionFilters/DiscountFilter.tsx

Blocos: 1 (Search/Filters), 2 (UI), 5 (Perf)

Context: Implementei filtro que mostra "Deságio > 30%".
Mas não tenho certeza se o cálculo está 100% preciso.

Exigências:
✓ Validar fórmula de deságio (avaliação vs lance)
✓ Teste com valores edge-case (avaliação = lance, negative)
✓ Verificar persistência ao mudar página
✓ Performance em 10k+ lotes

Tone: Crítico. Exija prova de precisão numéririca até 0.01%.
```

### Example 3: Performance Issue
```
🕵️ Auction Sniper & QA: Dashboard lento para usuário com 500+ lances
Arquivo: src/app/[tenantId]/dashboard/page.tsx

Blocos: 4 (Dashboard), 5 (Performance)

Context: USer com 500+ lances ativos vê load time de 8s.
Metrics: LCP > 6s (target 2.5s), CLS = 0.25 (target 0.1).

Exigências:
✓ Identify bottleneck (DB query vs render vs network)
✓ Profiling com DevTools
✓ Lazy load strategy
✓ Gherkin para "dashboard com 500 bids"

Tone: Crítico. Performance degradation = bug crítico.
```

---

## ⚡ Resposta Esperada

Quando você invoca este agent, espere:

### ✅ Você VAI Receber:
- Stack trace completo (não "parece errado")
- Proof de sincronização (timestamps, logs)
- Cenários Gherkin testáveis
- Código diff com corrações
- Checklist de validação pré-deploy

### ❌ Você NÃO VAI Receber:
- "Parece correto"
- Aproximações ou "depois a gente melhora"
- Validações superficiais
- Código sem testes
- Metrometros ou achômetros

---

## 🔗 Integração com Workflow

### Code Review
```
1. Dev abre PR
2. Copilot/Cursor invoca agent: 🕵️ SA-QA: Code review [PR link]
3. Agent valida blocos críticos (1, 5, 6)
4. Se FAIL → Request changes
5. Se PASS → Green flag
```

### Test Planning
```
1. QA lê user story de feature de leilão
2. Usa Bloco 6 (BDD) como base
3. Escreve Gherkin scenarios
4. Playwright implementa automação
5. Copilot valida coverage
```

### Performance Audit
```
1. Monitoring detecta latência > 500ms
2. Invoke: 🕵️ SA-QA: Performance audit [componente]
3. Agent exige profiling + drill-down
4. Fornece código otimizado
5. Valida com E2E test
```

---

## 📞 Contact & Escalation

**Quando invocar este agent NÃO resolve o problema:**
1. Escalate para QA Lead
2. Forneça: agent output + seu contexto + stack trace
3. Possível análise manual + post-mortem

**Quando há discordância com agent:**
1. Documentar discordância com a.md
2. Submeter como issue em `.github/issues/`
3. Revisar protocolo se necessário

---

## 🎓 Training & Onboarding

**Para novo dev que precisa entender este agent**:
1. Leia `auction-sniper-qa.agent.md` (10min)
2. Leia `auction-sniper-qa.quick-reference.md` (5min)
3. Execute 1 request simples com agent
4. Revise 1 PR usando agent como validador
5. You're ready! 🚀

---

**Version**: 1.0.0 | **Updated**: 7/02/2026 | **Status**: ✅ Production
