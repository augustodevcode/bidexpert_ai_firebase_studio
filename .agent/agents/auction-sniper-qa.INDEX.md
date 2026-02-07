# 🕵️ Auction Sniper & QA Architect - Agent Files Index

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Owner**: QA Lead & Strategic Auction Specialist  
**Last Updated**: 7 Fevereiro de 2026

---

## 📁 File Structure

```
.agent/agents/
├── auction-sniper-qa.agent.md                 # MAIN AGENT DEFINITION (115+ atribuições)
├── auction-sniper-qa.quick-reference.md       # QUICK REF CARD (5min read)
├── auction-sniper-qa.USAGE.md                 # HOW TO INVOKE (instruções completas)
└── auction-sniper-qa.INDEX.md                 # THIS FILE

Root:
├── AGENTS.md                                  # UPDATED: Added Auction Sniper entry
```

---

## 📚 Files Guide

### 1. `auction-sniper-qa.agent.md` ⭐ **START HERE**
**O que é**: Definição completa do agent com as 115+ atribuições categorizadas.

**Contém**:
- Persona & Objetivo Estratégico
- 7 Blocos de Protocolo de Auditoria
- Checklist de Validação
- Tom de Voz
- Referências & Padrões
- Regras de Ambiente

**Tamanho**: ~400 linhas | **Read Time**: 15-20 minutos

**Quando ler**:
- Onboarding de novo dev para entender capabilities
- Quando quer revisão profunda do protocolo
- Para custom instructions no Copilot/Cursor
- Training de QA team

**Como usar**: 
```powershell
# Option 1: Cole em Custom Instructions do Copilot
Settings > Copilot > Custom Instructions > Cole conteúdo deste arquivo

# Option 2: Reference quando invocar
🕵️ Auction Sniper: [tarefa]. Ver protocolo em auction-sniper-qa.agent.md Bloco 5.
```

---

### 2. `auction-sniper-qa.quick-reference.md` ⚡ **DAILY DRIVER**
**O que é**: Cartão de referência rápida para uso diário, sem a síntese de 20 páginas.

**Contém**:
- Acionamento Instantâneo (3 métodos)
- Checklist Ultra-Essencial (5 blocos)
- Tone Override
- BDD Scenario Template (copy-paste)
- Common Metrics Table
- Integration Checklist
- Common Patterns to Audit

**Tamanho**: ~150 linhas | **Read Time**: 5 minutos

**Quando ler/usar**:
- Todo dia antes de código review
- Quando precisa do BDD template
- Para metrics reference
- Como bookmark no VSCode

**Pro Tip**: Mantenha aberto em split-screen ao revisar PRs:
```
VSCode Left: Code being reviewed
VSCode Right: auction-sniper-qa.quick-reference.md (Security checklist)
```

---

### 3. `auction-sniper-qa.USAGE.md` 📖 **OPERATIONAL MANUAL**
**O que é**: Manual de operação detalhado com excemp

los reais e fluxos de trabalho.

**Contém**:
- Quando Invocar (3 Categorias: Crítico/Importante/Opcional)
- Como Invocar (3 Métodos)
- Protocolo de Invocação (Step-by-step)
- Template de Request (copy-paste)
- 3 Exemplos Reais (bug, feature, performance)
- Integração com Workflow (Code Review, Test Planning, Perf Audit)
- Contact & Escalation

**Tamanho**: ~300 linhas | **Read Time**: 10-15 minutos

**Quando ler**:
- Primeira vez invocando agent
- Training de novo dev
- Quando não sabe como formular request
- Para understand integração com CI/CD

**Como usar**:
1. Lea a seção "Quando Invocar" (match seu case)
2. Use template de request (copy-paste)
3. Remplace [placeholders] com seu contexto
4. Invoke com runSubagent ou chat mention

---

### 4. `AGENTS.md`
**O que é**: Arquivo global de agentes do projeto (atualizado).

**Update Made**: 
- ✅ Adicionada seção "🕵️ Auction Sniper & QA Architect"
- ✅ Links para todos os arquivos do agent
- ✅ Quick how-to-invoke
- ✅ Responsabilidades listadas

**Seu Role**: Referência global para todos os modelos IA descobrirem este agent.

---

## 🚀 Quick Start (3 Minutes)

**Se você tem 3 minutos**:
1. Leia: `auction-sniper-qa.quick-reference.md`
2. Bookmark na aba do VSCode
3. Quando revisar código de leilão, abra ao lado

**Se você tem 15 minutos**:
1. Leia: `auction-sniper-qa.agent.md` (até Bloco 5)
2. Revise: Checklist de Validação
3. Entenda: Tom de Voz
4. Pratique: Formule 1 request usando template

**Se você tem 30 minutos**:
1. Leia: Todos os 3 documentos acima
2. Trabalhe através: Exemplos Reais em USAGE.md
3. Setup: Custom Instructions no seu Copilot/Cursor
4. Teste: Invoque com 1 tarefa real

---

## 🎯 By Use Case - Qual Arquivo?

| Seu Caso | Arquivo | Seção |
|----------|---------|--------|
| **"Quero usar este agent"** | USAGE.md | How to Invoke |
| **"Preciso validação rápida"** | Quick-Ref | Checklist |
| **"Qual é o protocolo completo?"** | agent.md | Protocolo de Auditoria |
| **"Exemplos de como invocar"** | USAGE.md | Exemplos Reais |
| **"BDD Gherkin template"** | Quick-Ref | BDD Template |
| **"Metrics para validar"** | Quick-Ref | Metrics Table |
| **"Training novo dev"** | All 3 | Opção "30 minutos" |
| **"Entender quando invocar"** | USAGE.md | Quando Invocar |
| **"Tone & comunicação"** | agent.md | Bloco 7 |
| **"Security checklist"** | agent.md | Bloco 5 |

---

## 🔗 Related Documentation

### Project-Level
- `.github/copilot-instructions.md` - Master rules para todos agentes
- `AGENTS.md` - Registro global de agentes (updated)
- `.agent/workflows/parallel-development.md` - Workflow branching

### Skills (Complementary)
- `.github/skills/master-data-seeding/SKILL.md` - Para seed data validation
- `.github/skills/web-design-reviewer/SKILL.md` - Para UI/UX review

### Testing
- `.vitest.config.ts` - Jest/Vitest config
- `playwright.config.ts` - E2E testing config
- `tests/e2e/` - E2E test directory

### DB & Queries
- `prisma/schema.prisma` - Data schema
- `scripts/ultimate-master-seed.ts` - Master seed

---

## 🛠️ Setup Guide

### Para GitHub Copilot (Recomendado)
```powershell
1. Abra Settings (Ctrl+,)
2. Busque por: "Copilot Custom Instructions"
3. Cole conteúdo de: auction-sniper-qa.agent.md
4. Marque como: "System Instructions"
5. Salve e reload VSCode
6. Next chat, ele usará o protocolo automaticamente
```

### Para Cursor IDE
```powershell
1. Abra .cursor/rules
2. Opção 1: Crie rules/auction-sniper-qa.cursor
3. Opção 2: Adicione em .cursorignore:
   
   [auction-sniper-qa]
   apply_to_all_files: true
   content: [Cole do agent.md]

4. Reload Cursor
```

### Para Gemini, Claude (Chat Direto)
```
Prefixe cada request com:
🕵️ Auction Sniper & QA Mode Ativado.
Protocolo: [Bloco X]. Tone: Crítico.
Cole as partes relevantes do agent.md se necessário.
```

---

## ✅ Validation Checklist (Para você que criou este agent)

Se você está mantendo este agent, valide:

- [ ] Versão atualizada em header de cada arquivo
- [ ] Links internos funcionam (auction-sniper-qa.*)
- [ ] AGENTS.md linkado corretamente
- [ ] Quick-ref matches com agent.md (blocos sync)
- [ ] Exemplos em USAGE.md são realistas
- [ ] No typos em procedimentos críticos
- [ ] Template de request é copy-paste friendly
- [ ] Tone de voz consistente em todos os marcas

---

## 📞 Support & Updates

**Se você encontrou um bug no agent**:
1. Document: Qual arquivo, qual seção, qual erro
2. Submit: Issue em `.github/issues/auction-sniper-qa-bug`
3. Assign: QA Lead
4. Priority: Crítico se afeta "Como Invocar"

**Se você quer adicionar novo Bloco ao protocolo**:
1. Escreva: Proposta de novo bloco
2. Valide: Com QA team (não afeta existing)
3. Update: Todos os 3 arquivos em paralelo
4. Version: Increment auction-sniper-qa.agent.md header

**Se você está treinando outro dev**:
1. Siga: "Quick Start (3 Minutes)" section
2. Demo: 1 real task using agent
3. Supervised: Primeira invocação deles
4. Autonomy: Ready to use independently

---

## 📊 Metrics de Adoção

**Tracking para medir sucesso deste agent**:
- Número de invocações por sprint
- Issues filtradas por "SA-QA approved"
- PRs com "SA-QA validation ✓" label
- Bugs caught by protocol vs post-prod bugs

---

**Version**: 1.0.0 | **Last Updated**: 7/02/2026 | **Status**: ✅ Active
