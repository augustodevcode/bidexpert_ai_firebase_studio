# 🕵️ Auction Sniper & QA Architect Agent

> **The Strictest Auditor for Auction Platform Excellence**

---

## ⚡ Quick Start (30 Seconds)

**Você tem uma tarefa de leilão/bidding?**

1. Abra seu chat (Copilot, Cursor, Gemini)
2. Digite: `🕵️ Auction Sniper: [sua pergunta]. Protocolo: Bloco 5.`
3. Envie  
4. Agent vai validar com protocolo rígido, exigindo prova
5. Receberá resposta técnica, sem aproximações

**Para tarefas complexas:**
```powershell
runSubagent {
  "agentName": "auction-sniper-qa",
  "prompt": "Auditar [sua tarefa]. Blocos 5+6. Tone crítico."
}
```

---

## 📚 What's in This Directory?

| Arquivo | Tamanho | Leitura | Propósito |
|---------|---------|---------|-----------|
| **agent.md** | ~400 linhas | 15-20 min | Definição COMPLETA do agent (115+ atribuições) |
| **quick-reference.md** | ~150 linhas | 5 min | Cartão de referência RÁPIDA (use diariamente) |
| **USAGE.md** | ~300 linhas | 10-15 min | Como INVOCAR (meta-procedimento) |
| **INDEX.md** | ~250 linhas | 10 min | Guia de NAVEGAÇÃO entre arquivos |
| **CHEATSHEET.md** | ~200 linhas | 5 min | Diagramas Mermaid + decision trees |
| **EXAMPLES.md** | ~300 linhas | 15 min | Exemplos REAIS prontos para copy-paste |
| **README.md** | Este | 2 min | Visão geral (arquivo atual) |

---

## 🎯 Choose Your Reading Path

**Se você tem 2 minutos:**
- Leia este README

**Se você tem 5 minutos:**
- Leia: `quick-reference.md`
- Bookmark na aba do VSCode

**Se você tem 15 minutos (RECOMENDADO):**
1. Leia: `agent.md` (até Bloco 5)
2. Revise: Checklist de Validação
3. Pratique: `EXAMPLES.md` (Example 1)

**Se você tem 30 minutos (COMPLETO):**
1. Leia: `agent.md` (todos os 7 blocos)
2. Estude: `USAGE.md` (como invocar)
3. Trabalhe: `EXAMPLES.md` (todos os 5 exemplos)
4. Setup: Custom Instructions no Copilot/Cursor
5. Teste: Seu primeiro request real

---

## 🚀 Quando Invocar Este Agent

### 🔴 CRÍTICO (Sempre Invocar)
- [ ] Bug em bidding (race condition, double-bid, loss of data)
- [ ] Cálculos financeiros (ROI, deságio, taxas)
- [ ] Sincronização servidor-cliente
- [ ] Segurança ou audit trail
- [ ] Performance crítica (> 500ms latency)

### 🟠 IMPORTANTE (Recomendado)
- [ ] Search/Filtros de leilão
- [ ] UI/UX de cards ou banners
- [ ] Dashboard de investidor
- [ ] E2E testing ou BDD
- [ ] Code review pré-merge

### 🟡 OPCIONAL (Use Se Necessário)
- [ ] Notificações ou relatórios
- [ ] Features tangenciais
- [ ] Brainstorm competitivo

---

## 🔥 Core Capabilities (115+ Protocolo)

**7 Blocos de Auditoria Integrada:**

1. **🔍 Search & Filtros** - Deságio preciso, geo, persistência, real-time count
2. **🖼️ UI/UX & Conversão** - Cards, banners, social proof, timer, transparency
3. **📄 Página do Lote** - ROI calc, docs, Street View, similaridade  
4. **📊 Dashboard** - WebSocket, KYC, calendário, métricas
5. **🛡️ Segurança Crítica** - Race conditions, sync, audit trail, CSRF
6. **🧪 BDD Testing** - Gherkin scenarios, casos críticos
7. **🎤 Tone & Voz** - Crítico, sem tolerância para aproximações

---

## ⚡ Common Invocation Patterns

### Pattern 1: Bug Report
```
🕵️ Auction Sniper & QA - CRITICAL BUG
[Arquivo] [O que deu errado] [Evidência]
Blocos: 5+6 | Tone: Crítico
```

### Pattern 2: Feature Validation  
```
🕵️ Auction Sniper & QA - FEATURE VALIDATION
[Arquivo] [Feature implementada] [Teste dados]
Blocos: 1+2 | Tone: Crítico
```

### Pattern 3: Performance Audit
```
🕵️ Auction Sniper & QA - PERFORMANCE BUG
[Métrica atual] [Target] [Componente]
Blocos: 4+5 | Tone: Crítico
```

### Pattern 4: Code Review
```
🕵️ Auction Sniper & QA - CODE REVIEW
[PR #] [Arquivo] [Contexto]
Blocos: [relevantes] | Tone: Crítico
```

### Pattern 5: Test Creation
```
🕵️ Auction Sniper & QA - E2E TEST
[Gherkin scenario] [Arquivo]
Blocos: 6+5 | Tone: Crítico
```

---

## 📊 By the Numbers

| Métrica | Value |
|---------|-------|
| **Atribuições de Auditoria** | 115+ |
| **Blocos Temáticos** | 7 |
| **Checkpoints de Validação** | 32+ |
| **BDD Gherkin Scenarios** | 20+ templates |
| **Common Patterns** | 10+ |
| **Pre-deployment Checklist Items** | 30+ |

---

## 🔗 Integration Points

**Ao Usar Este Agent:**

1. **Code Review** → Loop integration com GitHub PR labels
2. **Test Planning** → Gherkin → Playwright automation
3. **CI/CD** → Performance gates ("< 500ms or block merge")
4. **Onboarding** → Training loop novo dev em padrões
5. **Escalation** → Quando agent não resolve, esclape para QA Lead

---

## 🎓 Getting Started Checklist

- [ ] Leia este README (2 min)
- [ ] Leia `quick-reference.md` (5 min)
- [ ] Escolha 1 exemplo de `EXAMPLES.md` (3 min)
- [ ] Adapte para seu case
- [ ] Envie seu primeiro request
- [ ] Revise a resposta
- [ ] **You're ready!** 🚀

---

## 💡 Pro Tips

1. **Bookmark quick-ref.md** na aba do VSCode durante code review
2. **Use CHEATSHEET.md** diagrams como conversational reference
3. **Copy-search EXAMPLES.md** quando model usar estrutura parecida
4. **Customize blocos** - não precisa de todos (Blocos 1,5,6 são core)
5. **Keep tone crítico** - agent não aceita "parece correto"

---

## 📄 Complete File Structure

```
.agent/agents/
├── README.md ← You are here
├── auction-sniper-qa.agent.md (115+ protocol)
├── auction-sniper-qa.quick-reference.md (daily driver)
├── auction-sniper-qa.USAGE.md (how-to-invoke guide)
├── auction-sniper-qa.INDEX.md (file navigation)
├── auction-sniper-qa.CHEATSHEET.md (visual reference)
└── auction-sniper-qa.EXAMPLES.md (real-world templates)
```

---

## 📞 Support

**First time invocando?**
- Read: `USAGE.md` section "Quando Invocar"
- Choose: Your category (Crítico/Importante/Opcional)
- Copy: Template from `EXAMPLES.md`
- Send: Via runSubagent or chat mention

**Something not working?**
1. Check: `INDEX.md` file navigation
2. Match: Your case to a file
3. Search: CTRL+F in that file
4. Escalate: To QA Lead if agent unclear

**Want to add to protocol?**
1. Submit: Issue in `.github/issues/auction-sniper-qa`
2. Validate: With QA team (no breaking changes)
3. Update: All 6 files in sync

---

## ✅ Success Metrics

Você saberá que está usando este agent corretamente quando:

- ✅ Seus PRs passam código review mais rápido
- ✅ Bugs de race condition → 0 após validação
- ✅ Performance issues caught antes de prod
- ✅ Auditoria completa (sem achômetros)
- ✅ Equipe usa agent para 80%+ de leilões/bid features

---

## 🎯 Next Steps

1. **Setup** (2 min):
   ```powershell
   # Se quer permanent setup:
   # Copilot: Settings > Copilot > Custom Instructions
   # Cole conteúdo de: auction-sniper-qa.agent.md
   ```

2. **First Use** (5 min):
   ```
   🕵️ Auction Sniper: Estou revisando [arquivo] que implementa [feature].
   Protocolo: Blocos 5 (Security). Tone: Crítico.
   ```

3. **Master** (30 min):
   - Read all 6 files
   - Work through all 5 examples
   - Setup custom instructions
   - Use in real tasks

---

**Version**: 1.0.0 | **Status**: ✅ Production Ready  
**Created**: 7/02/2026 | **Maintained by**: QA Lead & Auction Specialist Team

**Next**: Read `quick-reference.md` or `USAGE.md` →
