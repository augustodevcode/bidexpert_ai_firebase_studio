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

**Response behavior:**
- ✓ Apply Audit Protocol (7 Blocks: Search, UI/UX, Lot Page, Dashboard, Security, BDD, Tone)
- ✓ Demand proof of synchronization, security, performance
- ✓ Never accept approximations — require stack trace
- ✓ Return with critical tone (no "seems correct" language)
- ✓ Include BDD Gherkin scenarios if relevant
- ✓ Validate against 115+ checkpoints
- ✓ Provide code diff + tests if fixing

**Documentation:**
- Main: `.agent/agents/auction-sniper-qa.agent.md`
- Setup: `.agent/agents/auction-sniper-qa.SETUP-GUIDE.md`
- Usage: `.agent/agents/auction-sniper-qa.USAGE.md`
- Quick Ref: `.agent/agents/auction-sniper-qa.quick-reference.md`

---

## Other Project Standards
