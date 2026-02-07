# 🛠️ Admin Architect & System Auditor - Real-World Examples

**5 Complete Request + Response Scenarios**

---

## EXAMPLE 1: Backoffice Lote Management Audit

### User Request:
```
Estamos migrando para um novo sistema de gestão de lotes.
Precisamos garantir que os dados legados sejam importados sem perda de integridade.

Checklist de validação:
- IDs únicos?
- Status workflow correto?
- Versionamento de alterações?
- Audit trail imutável?
```

### Agent Auto-Activation:
Keywords detected: `lotes`, `integridade`, `audit`  
Priority: **P1 - ALTO** (data integrity concern)

### Agent Response:

```
🛠️ ADMIN ARCHITECT & SYSTEM AUDITOR
Priority: P1 (DATA INTEGRITY)
Blocks Affected: 1, 4, 14, 23

═══════════════════════════════════════════

BLOCO 1: Gestão de Lotes (Inventory)
✓ Validação de ID Unique: 
  - Check: SELECT COUNT(*) FROM Lots WHERE id IS NOT NULL GROUP BY id HAVING COUNT > 1
  - Must return: 0 duplicates
  
✓ Mapeamento de Categoria:
  - Verify: All lots have valid categoryId reference
  - Query: SELECT * FROM Lots WHERE categoryId NOT IN (SELECT id FROM Categories)
  - Expected: Empty result set

✓ Versionamento de Lote:
  - Implement: Audit table (lot_id, changed_at, changed_by, previous_value, new_value)
  - Required: Every change logged with timestamp + user

✓ Audit Trail Imutável:
  - Use: Blockchain or append-only ledger
  - NO DELETE operations on audit logs
  - Suggestion: Use PostgreSQL immutable tables

═══════════════════════════════════════════

BLOCO 4: Compliance
✓ Checksum Validation:
  - Before import: Calculate SHA-256 of original file
  - After import: Recalculate on stored data
  - Must match: 100%

═══════════════════════════════════════════

BDD SCENARIO:

Feature: Bulk import de lotes com integridade
  Scenario: Importar 10.000 lotes legados
    Given 10k lotes em arquivo CSV
    When admin clica em "Importar"
    Then cada lote deve ter ID único
    And status workflow = "Rascunho"
    And audit trail criado para cada lote
    And checksum validado
    And nenhum lote duplicado

═══════════════════════════════════════════

AÇÃO ITEMS:
[P0] - Implementar audit table (HOJE)
[P1] - Validar checksum em todos os lotes (1h)
[P2] - Criar backup antes de importação (2h)
[P3] - Documentar processo de rollback (4h)

SUCESSO VERIFICADO SI:
✓ Zero lotes duplicados
✓ Audit trail completo
✓ Checksum 100% match
✓ BDD scenario passa
```

---

## EXAMPLE 2: WebSocket Latency & Bidding Engine

### User Request:
```
Os lances estão chegando com variação de latência.
Às vezes <100ms, às vezes >500ms.

Quais são as causas possíveis?
Como garantir que o cliente recebe o novo lance em <100ms?
```

### Agent Auto-Activation:
Keywords: `lances`, `latência`, `WebSocket`  
Priority: **P0 - CRÍTICO** (bidding engine concern)

### Agent Response:

```
🛠️ ADMIN ARCHITECT & SYSTEM AUDITOR
Priority: P0 (CRITICAL - BIDDING ENGINE)
Blocks Affected: 3, 5, 8, 16

═══════════════════════════════════════════

VALIDAÇÃO IMEDIATA:

Current Latency: 500ms (FAIL - target: <100ms)
Root Cause Analysis:
  ✗ WebSocket buffer: 200ms (backend serialization)
  ✗ Network RTT: 150ms (acceptable)
  ✗ Client processing: 150ms (JavaScript render)
  ✗ Clock drift detected: 50ms (NTP desync)

MITIGATION (Next 5 minutes):
  1. Increase WebSocket buffer size: 4KB → 64KB
  2. Sync NTP server: ntpdate -u ntp.ubuntu.com
  3. Enable compression: gzip on for WebSocket msgs
  4. Verify TCP_NODELAY enabled on server

═══════════════════════════════════════════

BLOCO 3: Motor de Lances
✓ Sincronização de Relógio:
  Current: Server at 14:30:45.234, Client at 14:30:45.102 = 132ms DRIFT
  Fix: Implement client-side NTP sync every 30 seconds
  Code:
    // Get server time
    const serverTime = await fetch('/api/time').then(r => r.json());
    const clientTime = Date.now();
    const drift = clientTime - serverTime.timestamp;
    
✓ Buffer de Latência:
  Current: Naive "accept if received before endTime"
  Better: Accept lance si (received_time + drift_compensation) < endTime
  
✓ Dead Man's Switch:
  Current: Not implemented ⚠️
  Implement: Si server doesn't receive heartbeat in 5sec, suspend bidding
  
═══════════════════════════════════════════

BLOCO 8: Monitoramento Real-Time
✓ WebSocket Health Check:
  - Metrics to collect:
    - Message latency percentiles (p50, p95, p99)
    - Connection uptime
    - Message drop rate
  - Alert si p95 latency > 200ms

═══════════════════════════════════════════

PROOF REQUIRED:

BEFORE FIX:
  Server logs showing latency distribution
  Client console showing processing time
  Network tab showing RTT
  
AFTER FIX:
  Latency percentiles from Prometheus/CloudWatch
  P95 latency < 100ms consistent
  Zero message drops
  Clock drift < 10ms
  
═══════════════════════════════════════════

ACTION ITEMS:
[P0] Implement NTP sync client-side (NOW)
[P0] Enable TCP_NODELAY + increase buffer (5 min)
[P0] Implement Dead Man's Switch (30 min)
[P1] Add monitoring dashboard (1 hour)
[P2] Load test WebSocket with 10k concurrent (next sprint)
```

---

## EXAMPLE 3: Financial Calculation Audit

### User Request:
```
Lote vendido por R$ 50.000.
Taxa de comissão é 5%.
Comissão = R$ 2.500?

Preciso verificar se o split está correto:
- 60% para comitente
- 5% para leiloeiro
- 35% para plataforma
```

### Agent Response:

```
🛠️ ADMIN ARCHITECT & SYSTEM AUDITOR
Priority: P0 (CRITICAL - FINANCIAL)
Blocks Affected: 7, 24

═══════════════════════════════════════════

VALIDAÇÃO FINANCEIRA:

Lote: R$ 50.000
Comissão: 5% = R$ 2.500 ✓ CORRETO

Split:
  Comitente: R$ 50.000 × 60% = R$ 30.000 ✓
  Leiloeiro: R$ 50.000 × 5% = R$ 2.500 ✓
  Plataforma: R$ 50.000 × 35% = R$ 17.500 ✓
  Total: R$ 50.000 ✓ (Fecha)

═══════════════════════════════════════════

VERIFICAÇÃO DE PRECISÃO:

⚠️ AVISO: Verificar se há centavos na venda

Exemplo:
  Venda: R$ 50.000,75
  Comissão 5%: R$ 2.500,0375 
  → Problema: Arredondar como? Piso? Teto? Nearest?
  
Recomendação: Explicitar regra de arredondamento:
  - Sempre PISO para plataforma (conservador)
  - Exemplo: R$ 2.500,0375 → R$ 2.500,03

═══════════════════════════════════════════

AUDIT TRAIL:

Todos os cálculos DEVEM estar no banco:
  Invoice:
    - lot_id: 12345
    - sale_amount_gross: 50000.75
    - commission_rate: 0.05
    - commission_amount: 2500.03
    - split_rules: {comittee: 0.60, auctioneer: 0.05, platform: 0.35}
    - committe_amount: 30000.45
    - auctioneer_amount: 2500.03
    - platform_amount: 17500.27
    - created_at: 2026-02-07T14:30:00Z
    - audit_hash: sha256(...)

═══════════════════════════════════════════

BDD SCENARIO:

Feature: Financial calculation accuracy
  Scenario: Calculate comissão para venda com centavos
    Given venda de R$ 50.000,75
    When sistema calcula 5% comissão
    Then comissão = R$ 2.500,03 (arredonda piso)
    And split segue configuração exata
    And audit trail criado com hash imutável

═══════════════════════════════════════════

ACTION ITEMS:
[P0] Verificar regra de arredondamento no código (NOW)
[P0] Auditar últimas 1000 vendas (checksum) (30 min)
[P1] Implementar audit hash (1 hour)
[P2] Criar teste E2E para múltiplos valores (2h)
```

---

## EXAMPLE 4: Security & LGPD Compliance

### User Request:
```
Estamos implementando novos campos de KYC.
Coletamos CPF, RG, comprovante de residência.

Como garantir que isso está em conformidade com LGPD?
Quais são os riscos de segurança?
```

### Agent Response:

```
🛠️ ADMIN ARCHITECT & SYSTEM AUDITOR
Priority: P1 (ALTO - COMPLIANCE)
Blocks Affected: 6, 11, 18, 23

═══════════════════════════════════════════

CHECKLIST LGPD:

✓ CONSENTIMENTO:
  - Usuário deve ACEITAR EXPLICITAMENTE coleta de PII
  - Guardar timestamp de aceitação + versão de termos
  - Permitir revogação de consentimento

✓ DADOS SENSÍVEIS:
  - CPF, RG, comprovante de residência = Nível MÁXIMO de proteção
  - Nunca em logs legíveis
  - Criptografia: AES-256 at rest, TLS 1.3 in transit

✓ RETENÇÃO:
  - Definir período de retenção: ex "24 meses após última transação"
  - Implementar auto-delete: dados expiram automaticamente

✓ DIREITO DO USUÁRIO:
  - Direito de acesso: usuário consegue baixar todo seu KYC?
  - Direito de exclusão: consegue pedir apagamento?
  - Direito de portabilidade: consegue exportar dados?

═══════════════════════════════════════════

CHECKLIST DE SEGURANÇA:

✗ DETECTADO: Campos de PII em response JSON
  Fix: Nur manter ID references, NOT actual values

✗ DETECTADO: Logs podem expor CPF/RG
  Fix: Implement sanitizer para remover PII antes de logar
  
✓ RECOMENDAÇÃO: Bucket S3 com encriptação + access logs
  S3:
    - ServerSideEncryptionConfiguration: AES256
    - PublicAccessBlockConfiguration: true
    - VersioningConfiguration: true (para audit trail)

═══════════════════════════════════════════

CODE EXAMPLE (Sanitization):

// ANTES (INSEGURO):
console.log('User KYC:', user); // Logs CPF!

// DEPOIS (SEGURO):
const sanitized = {
  user_id: user.id,
  kyc_status: user.kyc_status,
  verified_at: user.verified_at
  // CPF, RG, etc NOT logged
};
console.log('User KYC status:', sanitized);

═══════════════════════════════════════════

ACTION ITEMS:
[P0] Remover PII dos logs (TODAY)
[P0] Audit storage de RG/CPF (1 hour)
[P1] Implementar sanitizer (2h)
[P2] Criar data deletion API (4h)
[P3] LGPD audit quinzenal (próximo sprint)
```

---

## EXAMPLE 5: Admin UX Improvement

### User Request:
```
Admin leva em média 5 minutos para aprovar 10 lotes.

Queremos reduzir para 30 segundos.

Quais otimizações de UX/produtividade fazer?
```

### Agent Response:

```
🛠️ ADMIN ARCHITECT & SYSTEM AUDITOR
Priority: P2 (MÉDIO)
Blocks Affected: 2, 17, 21

═══════════════════════════════════════════

ANÁLISE DE PRODUCTIVITY:

Current Flow (5 min para 10 lotes):
  1. Open lot: 10 sec × 10 = 100 sec
  2. Click "Revisar": 5 sec × 10 = 50 sec
  3. Scroll to "Aprovar": 10 sec × 10 = 100 sec
  4. Click "Aprovar": 5 sec × 10 = 50 sec
  5. Confirm modal: 20 sec × 10 = 200 sec
  Total: 500 sec (8.3 min) ⚠️ Observation: Actually slower!

═══════════════════════════════════════════

RECOMMENDED OPTIMIZATIONS:

✓ BULK APPROVAL (Bloco 17):
  Implementar checkbox para selecionar múltiplos lotes
  Uma confirmação aprova todos 10 de uma vez
  Estimated: 30 sec total ✓

✓ KEYBOARD SHORTCUTS (Bloco 21):
  Ctrl+A = Aprovar lote atual
  Ctrl+N = Próximo lote (sem sair da lista)
  Ctrl+S = Salvar pending changes

✓ INLINE EDITING (Bloco 2, 21):
  Admin consegue editar "Status" direto na tabela
  Sem abrir modal separado

✓ PERSISTENT FILTERS (Bloco 21):
  Lembrar status = "Pending" da última sessão
  Só mostrar lotes que precisam aprovação

═══════════════════════════════════════════

NEW PROPOSED FLOW (30 sec para 10 lotes):
  1. Filter: "Status = Pending" (já persistido) = 0 sec
  2. See list of 10 lotes = 5 sec
  3. Select all (Ctrl+A): 2 sec
  4. Bulk approve button: 3 sec
  5. Confirm (1 click): 20 sec
  Total: 30 sec ✓ 10x faster!

═══════════════════════════════════════════

ACTION ITEMS:
[P1] Implement checkbox for bulk selection (2h)
[P2] Add keyboard shortcuts (1h)
[P2] Implement inline editing (3h)
[P3] Add persistent filters (1h)

TEST (BDD):
Scenario: Admin aprova 10 lotes em < 1 minuto
  Given admin na lista de lotes pending
  When seleciona todos com Ctrl+A
  And clica "Bulk Approve"
  Then todos 10 lotes mudam para "Approved"
  And audit trail criado para cada lote
  And confirmação visual de sucesso
```

---

## 🎯 Key Takeaways

Each of your requests will automatically trigger:

1. **Context Analysis**: Which 24 blocks are affected?
2. **Priority Detection**: P0 crítico ou P2 médio?
3. **Block-by-Block Validation**: What needs to be checked?
4. **Proof Requirement**: Logs, metrics, or code examples
5. **BDD Scenarios**: Ready-to-run tests
6. **Action Items**: Prioritized by urgency

**This ensures 150+ attributes are validated every time!** 🎉
