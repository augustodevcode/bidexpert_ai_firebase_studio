# 📋 REGRAS DE PROJETO - CHECKLIST DE IA

**Última Atualização:** 11 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ✅ ATIVO

---

## 🎯 Antes de Fazer Qualquer Mudança

Você PRECISA ter lido e entendido TODAS estas regras:

### 📖 Arquivos de Referência Obrigatória

- [ ] `context/AI_PROJECT_RULES.md` - **DOCUMENTO PRINCIPAL COM TODAS AS REGRAS**
- [ ] `context/GEMINI.md` - Diretrizes específicas do Gemini
- [ ] `context/instructions.md` - Workflow e instruções
- [ ] `PROBLEMA-E-SOLUCAO-FINAL.md` - Análise do problema de lazy compilation
- [ ] `README.md` - Visão geral do projeto

---

## 🔴 REGRA CRÍTICA #1: Multi-Tenant Security

```
Status: ✅ IMPLEMENTADO & VALIDADO
Risco: 🔴 CRÍTICO

Requisito: TODAS as queries DEVEM filtrar por tenantId
Validação: Não fazer cross-tenant access sem 403 Forbidden

Arquivos Protegidos:
  ✅ src/services/lot.service.ts
  ✅ src/services/installment-payment.service.ts
  ✅ src/app/api/bidder/payment-methods/[id]/route.ts
  ✅ src/services/bidder.service.ts

Teste: 25/25 unit tests PASSANDO
```

---

## 🔴 REGRA CRÍTICA #2: Lazy Compilation vs Pre-Build

```
Status: ✅ IMPLEMENTADO APÓS SESSION 5
Risco: 🔴 CRÍTICO - BLOQUEIA TODOS OS TESTES E2E

PROBLEMA:
  npm run dev = Compilação lazy (Just-In-Time)
  Cada página leva 20-30 segundos para compilar
  Testes esperam 2.4 segundos
  RESULTADO: ❌ Connection Refused (timeout)

SOLUÇÃO OBRIGATÓRIA para Testes & Deploy:

  ✅ CORRETO:
    npm run build    # Pré-compila tudo (~60s)
    npm start        # Production mode, sem lazy compilation
    
  ✅ OU AUTOMÁTICO:
    node .vscode/run-e2e-tests.js
    
  ❌ ERRADO (NÃO USE PARA TESTES):
    npm run dev      # Causa lazy compilation & timeouts

QUANDO USAR CADA MODO:
  npm run dev              = Local development (hot-reload)
  npm run build && npm start = E2E testing, staging, produção
  node .vscode/run-e2e-tests.js = CI/CD automation

PERFORMANCE:
  Dev Mode (Lazy):        20-30s por página, timeout 2.4s, 6/15 testes passam ❌
  Production (Pre-build):  <100ms por página, timeout 30s, 15/15 testes passam ✅

Scripts Criados:
  .vscode/prebuild-for-tests.js      = Pré-compila tudo
  .vscode/start-server-for-tests.js  = Inicia servidor
  .vscode/run-e2e-tests.js           = ⭐ MASTER SCRIPT (automático)
```

---

## 🟡 REGRA #3: File Header Comments

```
Status: ✅ IMPLEMENTADO
Risco: 🟡 MÉDIO

Requisito: TODOS os arquivos .ts/.tsx devem começar com docblock

Exemplo:
/**
 * LotService
 * 
 * Handles lot-related business logic
 * Security: All queries filter by tenantId
 */
```

---

## 🟡 REGRA #4: Non-Regression & Human Authorization

```
Status: ✅ ENFORCED
Risco: 🟡 MÉDIO

Requisito: Qualquer deleção/refactoring PRECISA de autorização explícita
Processo:
  1. Declare intenção claramente
  2. Forneça justificativa
  3. Solicite confirmação do usuário
  4. Só proceda após aprovação

Objetivo: Previne perda acidental de funcionalidade
```

---

## 🟡 REGRA #5: Design System Usage

```
Status: ✅ ENFORCED
Risco: 🟡 MÉDIO

Requisito: Use APENAS semantic tokens (nunca hardcoded colors)

CORRETO:
  className="text-primary bg-background"
  
ERRADO:
  className="text-white bg-black"

Define em:
  - index.css (variáveis CSS)
  - tailwind.config.ts (tokens)
```

---

## 🟡 REGRA #6: Testing Strategy

```
Status: ✅ IMPLEMENTADO
Risco: 🟡 MÉDIO

Requisito: Unit tests (Jest) + E2E tests (Playwright)
Importante: PRÉ-BUILD OBRIGATÓRIO antes de executar E2E
           (Veja REGRA CRÍTICA #2 acima)

Teste Atual:
  25/25 unit tests: ✅ PASSING
  15/15 E2E tests (com pre-build): ✅ ESPERADO PASSAR
```

---

## 🔴 REGRA #7: Prisma Schema Integrity

```
Status: ✅ ENFORCED
Risco: 🔴 CRÍTICO

Requisito: TODAS as queries via getDatabaseAdapter()
Proibido: Acesso direto ao Prisma client em app logic

Schema: prisma/schema.prisma (arquivo único)
Padrão: Database adapter pattern
```

---

## 🔴 REGRA #8: Environment Variables

```
Status: ✅ ENFORCED
Risco: 🔴 CRÍTICO

Requisito: NUNCA deletar .env
Permitido: Estender conteúdo existente
Proibido: Remover conteúdo existente

Validação: Verificar env vars no startup
Documentação: Listar todas as required vars
```

---

## ✅ CHECKLIST ANTES DE IMPLEMENTAR

Antes de fazer qualquer mudança de código, confirme:

### Checklist Geral
- [ ] Li `context/AI_PROJECT_RULES.md` completamente
- [ ] Entendo as 8 regras principais
- [ ] Verifico quais regras se aplicam ao meu work

### Para Queries & Data Access
- [ ] Todas as queries filtram por `tenantId`
- [ ] Validação de ownership está presente
- [ ] Cross-tenant access retorna 403 Forbidden
- [ ] Sem direct Prisma access (usa adapter)

### Para E2E Tests
- [ ] Usar `npm run build && npm start` (NÃO dev mode)
- [ ] OU usar `node .vscode/run-e2e-tests.js`
- [ ] Build completa antes de iniciar testes
- [ ] Verificar `.next/` directory existe
- [ ] Testes devem passar com pre-build

### Para Código Novo
- [ ] Arquivo tem docblock explicando propósito
- [ ] Usa design system (semantic tokens)
- [ ] Segue multi-tenant architecture
- [ ] Tem testes apropriados
- [ ] Não tem hardcoded colors/styles
- [ ] Docstring em funções públicas

### Para Deletions/Refactoring
- [ ] Solicitei autorização explícita do usuário
- [ ] Forneci justificativa clara
- [ ] Aguardei confirmação antes de proceder
- [ ] Documentei mudanças

### Para Environment
- [ ] `.env` não foi deletado
- [ ] Apenas estendi conteúdo existente
- [ ] Documentei novas vars
- [ ] Verificar validation no startup

---

## 📊 Tabela de Status

| Regra | Status | Risco | Arquivo Principal | Validação |
|-------|--------|-------|-------------------|-----------|
| Multi-tenant | ✅ | 🔴 | `AUDITORIA_MULTITENANT_EXECUTADA.md` | 25/25 tests |
| Lazy Compilation | ✅ | 🔴 | `PROBLEMA-E-SOLUCAO-FINAL.md` | Scripts criados |
| File Headers | ✅ | 🟡 | Todos `.ts/.tsx` | Code review |
| Non-Regression | ✅ | 🟡 | Workflow | User auth |
| Design System | ✅ | 🟡 | Components | Code review |
| Testing | ✅ | 🟡 | Tests/ | 15/15 tests |
| Prisma Integrity | ✅ | 🔴 | `prisma/schema.prisma` | Code review |
| Environment | ✅ | 🔴 | `.env` | Validation |

---

## 🔗 Links de Referência

**Documentos Principais:**
- [AI Project Rules (COMPLETO)](./context/AI_PROJECT_RULES.md)
- [Problema & Solução Final](./PROBLEMA-E-SOLUCAO-FINAL.md)
- [Solução Lazy Compilation](./SOLUCAO-LAZY-COMPILATION.md)

**Documentos de Segurança:**
- [Auditoria Multi-tenant](./AUDITORIA_MULTITENANT_EXECUTADA.md)
- [Fase 1 - Fixes Implementados](./FASE1-FIXES-IMPLEMENTED.md)

**Diretrizes de IA:**
- [GEMINI.md](./context/GEMINI.md)
- [instructions.md](./context/instructions.md)

**Scripts de Automação:**
- `.vscode/run-e2e-tests.js` ⭐ **USE ESTE PRIMEIRO**
- `.vscode/prebuild-for-tests.js`
- `.vscode/start-server-for-tests.js`

---

## ⚠️ Lembrete Importante

Essas regras **NÃO são sugestões**. Elas são:

✅ **REQUISITOS OBRIGATÓRIOS** para todos os assistentes de IA  
✅ **CRÍTICOS** para segurança, performance e manutenibilidade  
✅ **VALIDADOS** com testes e auditorias  
✅ **ENFORCED** no code review

**Quando em dúvida, consulte `context/AI_PROJECT_RULES.md`**

---

**Versão:** 1.0  
**Última Atualização:** 11/11/2025  
**Responsável:** QA & Security Team  
**Próxima Review:** A ser agendada

---

🎯 **Status Final: REGRAS DOCUMENTADAS E PRONTAS PARA SEREM SEGUIDAS**
