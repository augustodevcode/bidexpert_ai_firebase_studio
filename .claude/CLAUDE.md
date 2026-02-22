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

## 🔖 CI/CD & Semantic Release Pipeline (OBRIGATÓRIO)

O projeto BidExpert usa **Semantic Release** com **Conventional Commits**. Todo agente DEVE seguir este padrão.

### Conventional Commits

Todo commit DEVE seguir: `<tipo>(escopo opcional): descrição`

| Tipo | Release | Tipo | Release |
|------|---------|------|---------|
| `feat` | minor (1.x.0) | `docs` | sem release |
| `fix` | patch (1.0.x) | `style` | sem release |
| `perf` | patch | `chore` | sem release |
| `refactor` | patch | `test` | sem release |
| `revert` | patch | `ci` | sem release |
| `BREAKING CHANGE` | major (x.0.0) | `build` | sem release |

**Enforcement:** commitlint (`.husky/commit-msg`) + typecheck (`.husky/pre-commit`)

### Canais de Release

| Branch | Canal | Versão Exemplo | Ambiente |
|--------|-------|----------------|----------|
| `main` | latest (produção) | `1.2.0` | PRD |
| `demo-stable` | demo (prerelease) | `1.3.0-demo.1` | DEMO |
| `hml` | alpha (prerelease) | `1.3.0-alpha.1` | HML |

### Pipeline (`.github/workflows/release.yml`)

```
Push → Quality Gate → Semantic Release → Inject Version (Vercel) → Migrate DB → Notify
```

### Regras Críticas
1. **SEMPRE** usar Conventional Commits (commitlint rejeita fora do padrão)
2. **NUNCA** incluir `prisma db push` / `migrate deploy` no buildCommand Vercel
3. **Deploy SOMENTE via git push** — NUNCA deploy direto via CLI
4. **Alterar AMBOS schemas Prisma** ao modificar modelos
5. **NUNCA** insira tokens ou senhas no chat; use `.env`

### Arquivos-Chave
- `.releaserc.json` — Configuração multi-canal do Semantic Release
- `.github/workflows/release.yml` — Pipeline de 5 jobs
- `commitlint.config.js` — Regras de conventional commits
- `.husky/commit-msg` — Hook de validação de commits
- `CHANGELOG.md` — Changelog automático
- `src/components/layout/app-version-badge.tsx` — Badge de versão no Footer
- `src/app/changelog/page.tsx` — Página de changelog SSR

### Skill Detalhada
- `.github/skills/semantic-release-cicd/SKILL.md`
