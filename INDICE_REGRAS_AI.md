# 🎯 ÍNDICE: REGRAS DE AI PARA O PROJETO BIDEXPERT

**Versão:** 1.0 | **Status:** ✅ ATIVO | **Data:** 11/11/2025

---

## 📍 ARQUIVOS DE REFERÊNCIA (EM ORDEM DE PRIORIDADE)

### 🔴 LEITURA OBRIGATÓRIA (PRIMEIRA)

1. **`AI_RULES_PIN.md`** ⭐ **START HERE**
   - Quick reference das 2 regras críticas
   - Checklist de 8 pontos
   - 5 minutos de leitura
   - PIN em toda sessão de chat

2. **`context/AI_PROJECT_RULES.md`** ⭐ **DOCUMENTO COMPLETO**
   - Todas as 8 regras detalhadas
   - Exemplos práticos
   - Performance comparison
   - Enforcement rules
   - 30-40 minutos de leitura

3. **`AI_RULES_CHECKLIST.md`**
   - Formato tabular e visual
   - Status de cada regra
   - Links de referência
   - Checklist antes de implementar

---

### 📚 DOCUMENTAÇÃO TÉCNICA

4. **`PROBLEMA-E-SOLUCAO-FINAL.md`** (Para entender Lazy Compilation)
   - Explicação técnica completa
   - Análise do problema
   - Comparação before/after
   - Timing e performance

5. **`SOLUCAO-LAZY-COMPILATION.md`** (Detalhes de implementação)
   - Descrição dos 3 scripts
   - Instruções de uso
   - Exemplos de execução
   - Performance metrics

6. **`AUDITORIA_MULTITENANT_EXECUTADA.md`** (Para entender segurança)
   - Análise completa de multi-tenant
   - 3 vulnerabilidades identificadas
   - 4 fixes implementados
   - Validação com 25/25 testes

---

### 🔧 DIRETRIZES ESPECÍFICAS DE IA

7. **`context/GEMINI.md`**
   - Regras específicas para Gemini
   - Persona e objetivo
   - Capacidades principais
   - Estratégia de testes

8. **`context/instructions.md`**
   - Workflow completo
   - Efficient tool usage
   - Design guidelines
   - Debugging guidelines

9. **`README.md`** (seção AI)
   - Visão geral das regras
   - Links principais
   - Quick reference

---

## 🗂️ ESTRUTURA HIERÁRQUICA DE LEITURA

```
PRIMEIRA SESSÃO:
├── AI_RULES_PIN.md (5 min) ⚡ START HERE
├── context/AI_PROJECT_RULES.md (30 min) ⚡ MANDATORY
├── PROBLEMA-E-SOLUCAO-FINAL.md (15 min) 📚
└── AUDITORIA_MULTITENANT_EXECUTADA.md (20 min) 📚

PRÓXIMAS SESSÕES:
├── AI_RULES_PIN.md (2 min) ⚡ REFRESH
├── Consulte outros conforme necessário
└── Procure em documentação antes de fazer changes

QUANDO DÚVIDA:
└── context/AI_PROJECT_RULES.md (SEMPRE a fonte de verdade)
```

---

## 🎯 AS 2 REGRAS CRÍTICAS (TL;DR)

### REGRA 1: Multi-Tenant Security
```
✅ Todas as queries DEVEM filtrar por tenantId
✅ Validar ownership antes de access
❌ Cross-tenant access = 403 Forbidden obrigatório
📖 Validado: 25/25 unit tests + auditoria
```

### REGRA 2: Lazy Compilation vs Pre-Build
```
❌ NEVER: npm run dev (para E2E tests)
✅ ALWAYS: npm run build && npm start
✅ OR: node .vscode/run-e2e-tests.js

Performance:
  Dev (lazy): 20-30s/page, testes falham ❌
  Prod (build): <100ms/page, testes passam ✅
```

---

## 📊 MAPA DE CONTEÚDO

| Arquivo | Propósito | Tempo | Leitura |
|---------|-----------|-------|---------|
| `AI_RULES_PIN.md` | Quick ref das 2 regras críticas | 5 min | ⚡ PRIORITY |
| `context/AI_PROJECT_RULES.md` | 8 regras detalhadas | 30-40 min | ⚡ OBRIGATÓRIO |
| `AI_RULES_CHECKLIST.md` | Visual checklist & status | 10 min | 📋 ÚTIL |
| `PROBLEMA-E-SOLUCAO-FINAL.md` | Lazy compilation explained | 15 min | 📚 TÉCNICO |
| `SOLUCAO-LAZY-COMPILATION.md` | Implementation details | 20 min | 📚 TÉCNICO |
| `AUDITORIA_MULTITENANT_EXECUTADA.md` | Security audit | 20 min | 📚 TÉCNICO |
| `context/GEMINI.md` | Gemini-specific rules | 15 min | 🤖 OPTIONAL |
| `context/instructions.md` | Workflow instructions | 20 min | 📖 REFERENCE |
| `README.md` | Project overview | 10 min | 📖 REFERENCE |

---

## ✅ WORKFLOW RECOMENDADO

### Para Primeira Sessão (Primeira Vez)
```
1. Ler AI_RULES_PIN.md (5 min)
2. Ler context/AI_PROJECT_RULES.md COMPLETO (30 min)
3. Ler PROBLEMA-E-SOLUCAO-FINAL.md (15 min)
4. Ler AUDITORIA_MULTITENANT_EXECUTADA.md (20 min)
5. Confirmar entendimento das 8 regras
```
**Total: ~70 minutos**

### Para Próximas Sessões
```
1. Ler AI_RULES_PIN.md (2 min refresh)
2. Procure no context/AI_PROJECT_RULES.md conforme necessário
3. Faça as changes conforme regras
```

### Quando Tiver Dúvida
```
→ Sempre consulte: context/AI_PROJECT_RULES.md
→ Fonte de verdade para qualquer regra
```

---

## 🔗 ACESSO RÁPIDO POR TÓPICO

### 🔐 SEGURANÇA (Multi-Tenant)
- `AUDITORIA_MULTITENANT_EXECUTADA.md`
- `context/AI_PROJECT_RULES.md` (RULE 1)
- `FASE1-FIXES-IMPLEMENTED.md`

### ⚡ PERFORMANCE (Lazy Compilation)
- `PROBLEMA-E-SOLUCAO-FINAL.md`
- `SOLUCAO-LAZY-COMPILATION.md`
- `context/AI_PROJECT_RULES.md` (RULE 2)
- Scripts: `.vscode/run-e2e-tests.js`

### 🎨 DESIGN (Semantic Tokens)
- `context/AI_PROJECT_RULES.md` (RULE 5)
- `context/GEMINI.md` (Design guidelines)

### 🧪 TESTES (Testing Strategy)
- `context/AI_PROJECT_RULES.md` (RULE 6)
- `PROBLEMA-E-SOLUCAO-FINAL.md`
- `SOLUCAO-LAZY-COMPILATION.md`

### 📝 CÓDIGO (File Headers)
- `context/AI_PROJECT_RULES.md` (RULE 3)
- Todos os `.ts/.tsx` files como exemplo

### 🚫 NÃO-REGRESSÃO
- `context/AI_PROJECT_RULES.md` (RULE 4)

### 💾 PRISMA & DATA
- `context/AI_PROJECT_RULES.md` (RULE 7)
- `prisma/schema.prisma`

### 🌍 ENVIRONMENT
- `context/AI_PROJECT_RULES.md` (RULE 8)
- `.env` (não editar, apenas estender)

---

## 📍 CHECKLIST: O QUE VOCÊ PRECISA SABER AGORA

Antes de fazer qualquer mudança:

```
MULTITENANT SECURITY:
  [ ] Entendo que tenantId é OBRIGATÓRIO em todas as queries
  [ ] Entendo que cross-tenant = 403 Forbidden
  [ ] Verifico ownership antes de permitir access

LAZY COMPILATION:
  [ ] Entendo que npm run dev = testes falhando
  [ ] Entendo que preciso: npm run build && npm start
  [ ] Entendo que tenho script: node .vscode/run-e2e-tests.js
  
CÓDIGO:
  [ ] Entendo que arquivos precisam de docblock
  [ ] Entendo que devo usar design system (sem hardcoded colors)
  [ ] Entendo que preciso de testes apropriados
  [ ] Entendo que deleção precisa de autorização

DADOS:
  [ ] Entendo que só uso getDatabaseAdapter()
  [ ] Entendo que .env NUNCA é deletado
```

---

## 🎓 LEARNING PATH

**Day 1 (Foundation):**
- [ ] Read: `AI_RULES_PIN.md`
- [ ] Read: `context/AI_PROJECT_RULES.md` 
- [ ] Read: `PROBLEMA-E-SOLUCAO-FINAL.md`
- [ ] Result: Know the 2 critical rules

**Day 2 (Deep Dive):**
- [ ] Read: `AUDITORIA_MULTITENANT_EXECUTADA.md`
- [ ] Read: `SOLUCAO-LAZY-COMPILATION.md`
- [ ] Test: Run scripts locally
- [ ] Result: Understand security & performance

**Day 3+ (Applied):**
- [ ] Apply: Use rules in every code change
- [ ] Reference: context/AI_PROJECT_RULES.md as needed
- [ ] Check: Use AI_RULES_CHECKLIST.md before implementing
- [ ] Result: Follow all 8 rules consistently

---

## 🎯 FINAL SUMMARY

| Item | What | Where | Time |
|------|------|-------|------|
| **Quick Ref** | 2 regras críticas | `AI_RULES_PIN.md` | 5 min |
| **Complete** | 8 regras detalhadas | `context/AI_PROJECT_RULES.md` | 30-40 min |
| **Checklist** | Antes de implementar | `AI_RULES_CHECKLIST.md` | 10 min |
| **Technical** | Lazy compilation details | `PROBLEMA-E-SOLUCAO-FINAL.md` | 15 min |
| **Security** | Multi-tenant audit | `AUDITORIA_MULTITENANT_EXECUTADA.md` | 20 min |

---

## ❓ FAQ RÁPIDO

**P: Qual arquivo ler primeiro?**  
R: `AI_RULES_PIN.md` (5 minutos)

**P: Qual é o documento oficial com todas as regras?**  
R: `context/AI_PROJECT_RULES.md`

**P: Posso usar `npm run dev` para E2E tests?**  
R: ❌ NÃO! Use `npm run build && npm start` ou `node .vscode/run-e2e-tests.js`

**P: Por que tenantId é tão importante?**  
R: Evita cross-tenant access (segurança crítica)

**P: O que fazer quando tiver dúvida?**  
R: Consulte `context/AI_PROJECT_RULES.md` (fonte de verdade)

**P: Preciso ler TUDO na primeira sessão?**  
R: Sim! Especialmente RULE 1, RULE 2, e depois documentação técnica.

---

## 📌 PIN THIS IN EVERY NEW CHAT SESSION

```
⭐ REMEMBER:
1. Read AI_RULES_PIN.md first (5 min)
2. Consult context/AI_PROJECT_RULES.md for details
3. Follow 2 critical rules:
   - Multi-tenant: tenantId em TODAS queries
   - Lazy compilation: NEVER npm run dev for E2E
```

---

**Created:** 11/11/2025  
**Version:** 1.0  
**Status:** ✅ ACTIVE  
**Maintainer:** QA & Security Team

**Last Updated:** 11/11/2025

---

🎯 **REGRAS DOCUMENTADAS, CONSOLIDADAS E PRONTAS PARA SEREM SEGUIDAS EM TODAS AS SESSÕES**
