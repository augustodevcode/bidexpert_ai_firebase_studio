# 🛠️ Admin Architect & System Auditor - Quick Reference Card

**Agent**: Admin Architect & System Auditor Master  
**Scope**: 150+ audit attributes across 24 thematic blocks  
**Invocation**: Keywords trigger auto-activation

---

## ⚡ Essential Checklist (The 15-Minute Audit)

### BEFORE EVERY DEPLOYMENT:

- [ ] **Block 1**: Lote IDs são únicos? Status workflow correto?
- [ ] **Block 3**: WebSocket latency < 100ms? Clock sync OK?
- [ ] **Block 5**: Database health check passed? Indexes OK?
- [ ] **Block 7**: Comissão calculada corretamente (5%)?
- [ ] **Block 11**: Dados sensíveis anonimizados em logs?
- [ ] **Block 14**: CI/CD pipeline passou?
- [ ] **Block 24**: Todas as 150+ atribuições validadas?

### BIDDING ENGINE VALIDATION:

```
✓ Incremento dinâmico: configurado?
✓ Buffer de latência: ativo?
✓ Dead man's switch: arm OK?
✓ Anti-sniper: sensibilidade ajustada?
✓ Histórico de auditoria: imutável?
✓ Sincronização de relógio: NTP OK?
```

### FINANCIAL VALIDATION:

```
✓ Cálculo de comissão: auditado?
✓ Split de pagamento: correto?
✓ Webhook de baixa automática: ativo?
✓ Reconciliação financeira: bate?
```

---

## 🔑 Key Keywords (Auto-Activation Triggers)

### 🔴 CRÍTICO
- backoffice
- lote, cartograf
- integridade dados
- auditoria
- compliance
- segurança admin
- performance infraestrutura
- lances simultâneos
- race condition

### 🟠 IMPORTANTE
- dashboard KPI
- webhook
- sincronização
- retenção usuário
- SEO
- cache
- latency
- error tracking

### 🟡 PADRÃO
- UI admin
- relatório
- métricas
- marketing automation
- post-sale workflow

---

## 📋 BDD Gherkin Quick Template

```gherkin
Feature: [Block Name]
  As an Admin Architect
  I want to validate [attribute name]
  So that [business outcome]

  Scenario: [Specific scenario]
    Given [precondition]
    When [action]
    Then [expected result]
    And [audit trail created]
```

---

## 📊 24 Blocks at a Glance

| Block | Focus | Priority |
|-------|-------|----------|
| 1 | Inventário de Lotes | P0 (Crítico) |
| 2 | UI/UX Admin | P2 (Médio) |
| 3 | Motor de Lances | P0 (Crítico) |
| 4 | Compliance Legal | P1 (Alto) |
| 5 | Performance/Infra | P0 (Crítico) |
| 6 | Gerenciamento Usuários | P1 (Alto) |
| 7 | Motor Financeiro | P0 (Crítico) |
| 8 | Monitoramento Real-Time | P1 (Alto) |
| 9 | BI e Dados | P2 (Médio) |
| 10 | Marketing Automation | P3 (Baixo) |
| 11 | Segurança/LGPD | P1 (Alto) |
| 12 | Conteúdo/SEO | P2 (Médio) |
| 13 | Pós-Venda | P2 (Médio) |
| 14 | Ferramentas Dev | P2 (Médio) |
| 15 | Elite Features | P3 (Viável) |
| 16 | Otimização Perf | P1 (Alto) |
| 17 | Produtividade | P2 (Médio) |
| 18 | Legal Blindagem | P1 (Alto) |
| 19 | AI/Automação | P2 (Médio) |
| 20 | Disaster Recovery | P0 (Crítico) |
| 21 | UX Admin Refino | P2 (Médio) |
| 22 | Métricas Negócio | P2 (Médio) |
| 23 | Governança Técnica | P1 (Alto) |
| 24 | Master Architect | P0 (Crítico) |

---

## 💬 Tone Override

**Default**: Architectural, demanding proof  
**For Production Issues**: CRITICAL - demand immediate mitigation  
**For Nice-to-Haves**: Question if aligned with 150+ protocol

---

## 🎯 When to Invoke This Agent

✅ **ALWAYS**:
- Code changes to backoffice or bidding engine
- Infrastructure/performance issues
- Security concerns
- Compliance/audit requests
- Data integrity problems
- Admin UI changes
- API modifications affecting auction flow

❌ **NOT NEEDED**:
- Homepage marketing changes
- User-facing cosmetic tweaks
- Documentation updates only
- Non-critical bug fixes

---

## 📞 Quick Contact Points

**Slack**: #bidexpert-admin-audit  
**Email**: admin-audit@bidexpert.com  
**Escalation**: team-lead@bidexpert.com (P0 issues only)

**Response Time**:
- P0 (Crítico): 5 minutes
- P1 (Alto): 1 hour
- P2 (Médio): 4 hours
- P3 (Baixo): 1 business day
