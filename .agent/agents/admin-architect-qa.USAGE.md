# 🛠️ Admin Architect & System Auditor - Usage Guide

**How to invoke this agent in 3 ways**

---

## Method 1: Auto-Activation (Recommended)

Just mention topics covered by 150+ audit attributes:

```
Implementei novo sistema de incremento dinâmico de lances. 
Pode revisar a integridade?
```

**Keywords detected**: "incremento", "lances"  
**Agent activation**: AUTOMATIC (no prefix needed)  
**Response time**: Immediate

---

## Method 2: Explicit Subagent Invocation

For complex requests requiring full audit protocol:

```
🛠️ Admin Architect & System Auditor: 
Auditar implementação de compliance LGPD. 
Validar contra Bloco 11 (Segurança/Privacidade).
```

---

## Method 3: Direct Chat Mention

In VSCode Copilot chat:

```
@admin-architect Revisar integridade de dados pós-venda gerados lote #12345
```

---

## 🎯 Real-World Request Templates

### REQUEST 1: Backoffice Inventory Audit

**You ask**:
```
Precisamos criar um painel de KPI para o backoffice que mostre:
- Total de lotes por status
- Distribuição por categoria
- Performance de venda (liquidez)
- Alertas de lotes sem lances faltando 1h

Quais validações preciso fazer?
```

**Agent activates automatically** (keywords: "painel", "lotes", "status", "KPI")

**Agent response includes**:
- ✅ Bloco 1: Validações de inventário
- ✅ Bloco 2: Validações UI/UX admin
- ✅ Bloco 4: Audit trail de cada visualização
- ✅ Bloco 9: Métricas de BI corretas
- ✅ BDD scenarios para testar

---

### REQUEST 2: WebSocket Real-Time Audit

**You ask**:
```
Os lances estão chegando com latência variável.
Tecnicamente: WebSocket delivery < 100ms?
Clock sync entre servidor e cliente?
```

**Agent activates automatically** (keywords: "lances", "latência", "WebSocket", "sync")

**Agent response includes**:
- ✅ Bloco 3: Validação de motor de lances
- ✅ Bloco 5: Performance & infraestrutura
- ✅ Bloco 8: Monitoramento real-time
- ✅ Stack trace + proof de latência atual
- ✅ Recomendações de otimização

---

### REQUEST 3: Financial Integrity Validation

**You ask**:
```
Confirmar que o cálculo de comissão está correto.
Lote vendido R$ 100k → comissão 5% = R$ 5k?
Auditagem do split de pagamento?
```

**Agent activates automatically** (keywords: "comissão", "cálculo", "financeiro", "audit")

**Agent response includes**:
- ✅ Bloco 7: Motor financeiro validado
- ✅ Bloco 24: Final handshake protocol (todas as 150+ atribuições monitoradas)
- ✅ Logs de reconciliação
- ✅ BDD scenario para testar caso de edge

---

### REQUEST 4: Security & LGPD Compliance

**You ask**:
```
Estamos armazenando RG/CPF dos usuários.
Como garantir conformidade LGPD?
Dados sensíveis estão anonimizados nos logs?
```

**Agent activates automatically** (keywords: "LGPD", "segurança", "dados sensíveis", "compliance")

**Agent response includes**:
- ✅ Bloco 11: Segurança, privacidade, LGPD
- ✅ Bloco 18: Blindagem legal & compliance
- ✅ Checklist de conformidade
- ✅ Recomendações de criptografia
- ✅ BDD para testar anonimização

---

### REQUEST 5: Admin UX Improvement

**You ask**:
```
Quero melhorar a experiência do backoffice.
Admin está levando muito tempo para aprovar lotes em bulk.
Como otimizar?
```

**Agent activates automatically** (keywords: "backoffice", "admin", "UX", "performance")

**Agent response includes**:
- ✅ Bloco 2: UI/UX administrativa
- ✅ Bloco 17: Experiência backoffice & produtividade
- ✅ Análise de fluxo atual
- ✅ Recomendações de UX (bulk edit, keyboard shortcuts, etc)
- ✅ BDD scenarios para testar usabilidade

---

## 📊 Response Structure

Every Agent Response includes:

**1. Executive Summary**
- What was validated
- Critical findings (if any)
- Timeline for fixes

**2. Block-by-Block Analysis**
- Which 24 blocks are affected
- Validation status per block
- Evidence (logs, metrics, stack traces)

**3. BDD Scenarios**
- Gherkin format
- Ready to run as E2E tests
- Coverage of happy path + edge cases

**4. Action Items**
- Immediate actions (P0 - within 5 min)
- Short-term fixes (P1 - within 1 hour)
- Long-term improvements (P2/P3 - next sprint)

**5. Success Metrics**
- How to verify fix worked
- Monitoring to set up
- SLOs to maintain

---

## ⏰ Typical Response Times

| Request Complexity | Response Time | Coverage |
|-------------------|---------------|----------|
| Simple validation | 2-3 minutes | 5-10 blocks |
| Medium audit | 5-10 minutes | 15-20 blocks |
| Full protocol (150+) | 15-20 minutes | All 24 blocks |

---

## 🔗 Integration Points

The Admin Architect agent integrates with:

1. **VSCode**: Auto-activation in Copilot chat
2. **Claude**: Auto-activation in Claude AI
3. **Gemini**: Via `.gemini/` configuration
4. **Antigravity**: GitHub Actions + Cloud Build
5. **Monitoring**: Slack/Discord alerts on critical findings
6. **CI/CD**: Blocks merge if critical blocks fail

---

## 📚 Reference Material

- **All 150+ Attributes**: `.agent/agents/admin-architect-qa.agent.md`
- **Quick Checklist**: `.agent/agents/admin-architect-qa.quick-reference.md`
- **Auto-Activation Keywords**: `.agent/agents/admin-architect-qa.AUTO-ACTIVATE.md`
- **Step-by-Step Setup**: `.agent/agents/admin-architect-qa.SETUP-GUIDE.md`
- **Examples**: `.agent/agents/admin-architect-qa.EXAMPLES.md`

---

## ✅ Checklist Before Asking

- [ ] You're working on backoffice, bidding, or infrastructure
- [ ] The issue affects Admin or Auction integrity
- [ ] You want validation against 150+ audit attributes
- [ ] You need BDD scenarios for testing
- [ ] You require proof (logs, metrics, stack traces)

**If YES to all**: Agent is already activated!

---

## ❌ When NOT to Use This Agent

- General project questions (use Plan agent)
- User-facing feature design (use Design agent)
- Marketing or content updates (use Growth agent)
- Routine bug fixes without infrastructure impact

---

## Need Help?

**Within VSCode**: Type agent name + context  
**Via Claude**: Mention "admin architect" or keywords  
**Via Slack**: @admin-architect-qa  
**For escalation**: Mention P0 + context to team-lead
