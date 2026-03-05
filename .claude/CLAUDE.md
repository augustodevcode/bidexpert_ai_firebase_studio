# Project Memory

Instructions here apply to this project and are shared with team members.

## Context

### 🕵️ Auction Sniper & QA Auto-Activation Protocol

**Automatic activation in ALL Claude chats for auction/bidding/ROI/security contexts:**

Whenever you detect ANY mention of:
- Leilão, auction, arrematação, lote, lot, bid, bidding, lance, lancer
- Deságio, desconto, percentual, discount, ROI, rentabilidade, lucro
- Search, filtro, busca, query, dashboard, carteira, portfolio
- WebSocket, sync, sincronização, Real-time, latency, race condition
- Concorrência, simultâneo, paralelo, audit, auditoria, log, compliance
- BDD, Gherkin, cenário, scenario, teste, test, security, segurança
- CSRF, XSS, vulnerabilidade, performance, lento, slow, timeout
- E2E, end-to-end, automation, automatização

**AUTOMATICALLY invoke this protocol:**

```
runSubagent({
  agentName: "auction-sniper-qa",
  prompt: "[user request]"
})
```

**NEVER wait for manual prefix `🕵️`** — Auto-activate immediately.

---

### 🛠️ Admin Architect & System Auditor Auto-Activation Protocol

**Automatic activation in ALL Claude chats for admin/backoffice/compliance contexts:**

Whenever you detect ANY mention of:
- Backoffice, admin, administrativo, administrativo
- Lote, lot, inventory, inventário
- Integridade dados, data integrity
- Audit, auditoria, log imutável
- Versioning, versionamento
- Compliance, LGPD, segurança
- Performance, infraestrutura, infra
- WebSocket, sincronização, latência
- Comissão, pagamento, financeiro
- Dashboard, painel, KPI
- Segurança, security, vulnerabilidade
- Post-sale, pós-venda, arremate
- DevOps, CI/CD, deployment

**AUTOMATICALLY invoke this protocol:**

```
runSubagent({
  agentName: "admin-architect-qa",
  prompt: "[user request]"
})
```

**NEVER wait for manual prefix `🛠️`** — Auto-activate immediately.

---

## Response Behavior (Both Agents)

Ao ativar qualquer agent:
- ✓ Apply Audit Protocol (7 Blocks for Auction Sniper OR 24 Blocks for Admin Architect)
- ✓ Demand proof of synchronization, security, performance
- ✓ Never accept approximations — require stack trace
- ✓ Return with critical tone (no "seems correct" language)
- ✓ Include BDD Gherkin scenarios if relevant
- ✓ Validate against 115+ (Auction) or 150+ (Admin) checkpoints
- ✓ Provide code diff + tests if fixing

---

## Documentation:

### Auction Sniper & QA:
- Main: `.agent/agents/auction-sniper-qa.agent.md`
- Setup: `.agent/agents/auction-sniper-qa.SETUP-GUIDE.md`
- Usage: `.agent/agents/auction-sniper-qa.USAGE.md`
- Quick Ref: `.agent/agents/auction-sniper-qa.quick-reference.md`

### Admin Architect & System Auditor:
- Main: `.agent/agents/admin-architect-qa.agent.md`
- Setup: `.agent/agents/admin-architect-qa.SETUP-GUIDE.md`
- Usage: `.agent/agents/admin-architect-qa.USAGE.md`
- Quick Ref: `.agent/agents/admin-architect-qa.quick-reference.md`

---

## 🌲 Git Worktree — Isolamento Primário de Desenvolvimento

**REGRA ANTES DE QUALQUER CÓDIGO:** Criar um Git Worktree dedicado com porta própria — sem clonar, sem docker obrigatório, sem `git stash`.

```bash
# 1. Ver o que está em execução
git worktree list
# Portas: 9005=humano | 9006=AI#1 | 9007=AI#2 | 9008=hotfix

# 2. Criar worktree + nova branch a partir de demo-stable
git worktree add worktrees/bidexpert-feat-X -b feat/X-$(date +%Y%m%d-%H%M) origin/demo-stable
cd worktrees/bidexpert-feat-X
PORT=9006 npm install && npm run dev
# → http://dev.localhost:9006

# 3. Limpeza após merge
git worktree remove worktrees/bidexpert-feat-X
git branch -d feat/X-...
```

**Skill completa:** `.github/skills/git-worktree-isolation/SKILL.md`

---

## 💱 Monetary Formatting Guardrail

- Normalize monetary values before arithmetic using `toMonetaryNumber()`.
- Use centralized currency formatter only; do not hardcode `R$` in dynamic totals.
- Default locale/currency: `pt-BR` + `BRL`; support view switch to `USD` and `EUR`.
- Any floating tail artifacts (e.g., `...00003`) are release-blocking defects.

---

## 🔐 E2E Auth Quick Reference

### Credenciais Canônicas (Seed Ultimate)
| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | `admin@bidexpert.com.br` | `Admin@123` |
| Leiloeiro | `carlos.silva@construtoraabc.com.br` | `Test@12345` |
| Comprador | `comprador@bidexpert.com.br` | `Test@12345` |
| Advogado | `advogado@bidexpert.com.br` | `Test@12345` |
| Vendedor | `vendedor@bidexpert.com.br` | `Test@12345` |
| Analista | `analista@lordland.com` | `password123` |

**REGRA:** `senha@123` é INCORRETA. Causa falhas silenciosas.

### Helper Centralizado
```typescript
import { loginAsAdmin, loginAs, CREDENTIALS } from './helpers/auth-helper';
```

### Tenant Resolution
- `demo.localhost:9005` → auto-lock tenant selector
- `localhost:9005` (sem subdomínio) → seleção manual obrigatória
- Em testes E2E, SEMPRE usar URL com subdomínio

### Seed Gate
`global-setup.ts` verifica automaticamente se o seed foi executado antes dos testes.
