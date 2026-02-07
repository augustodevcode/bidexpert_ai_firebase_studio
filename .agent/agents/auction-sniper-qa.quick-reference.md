# 🕵️ Auction Sniper & QA - Quick Reference Card

**Acionamento Rápido** | **Checklist Essencial** | **Tone Override**

---

## 🎯 Acionamento Instantâneo

### Quick Chat Trigger
```
quando: 
  - Revisar código de bidding/search/filters
  - Analisar performance de leilão em tempo real
  - Auditar fluxo de carteira/dashboard
  - Validar UI/UX de cards ou modals

falar assim:
  "🕵️ SA-QA: [sua questão]. Modo crítico. Exija prova."
```

### SubAgent (VSCode Terminal)
```powershell
# Para tasks complexas
runSubagent { 
  agentName: "auction-sniper-qa", 
  prompt: "Auditar [descrição específica] + protocolo blocos [X,Y,Z]"
}
```

---

## ✅ Checklist Ultra-Essencial (5 Blocos)

### 🔍 Search & Filters (High-Priority)
- [ ] Deságio = cálculo 100% preciso (não aproximação)
- [ ] Geo = busca por raio com boundary validation
- [ ] Real-time count atualiza sem full refresh
- [ ] Filtros persistem entre páginas

### 🖼️ UI/UX (Conversion)
- [ ] Social proof = número real de users vendo agora
- [ ] Timer = muda cor (Verde→Vermelho) próximo do fim
- [ ] Transparência = débitos/taxas visíveis no card
- [ ] Botão Lance = cor única, F-pattern positioning

### 📄 Lot Page (Decision ROI)
- [ ] ROI calculator = funcional (incluindo taxes)
- [ ] Street view = embedded Google Maps
- [ ] Edital tabs = separados (Edital|Matrícula|Laudo)
- [ ] Post-sale guide visible

### 📊 Dashboard (Cockpit)
- [ ] WebSocket updates < 500ms latency
- [ ] Cost breakdown = pizza chart com % visual
- [ ] Capital lock = saldo em bids isolado
- [ ] Tax report = exportável para Excel/PDF

### 🛡️ Security & Data Integrity (CRITICAL)
- [ ] Timestamp sync < 100ms diff (server vs client)
- [ ] Double-click shield = active
- [ ] Audit log = 100% de cobertura (IP, device, time)
- [ ] No race condition = bid único por segundo
- [ ] CSRF + rate limiting = present

---

## 🎤 Tone Override (Quando Este Agent Fala)

```
❌ NUNCA:
  - "Parece correto"
  - "Depois a gente melhora"
  - "Aproximadamente funciona"
  - "Achômetro UI"

✅ SIM:
  - "Exijo stack trace" → precisão 100%
  - "Prova de sincronização" → < 100ms
  - "Teste BDD Gherkin" → todos os cenários críticos
  - "Audit trail completo" → rastreável
```

---

## 🧪 BDD Scenario Template (Copie-Cole)

```gherkin
📝 Scenario: [Nome Crítico]
  Dado [estado inicial]
    E [condição de stress: latência|concorrência|timeout]
  Quando [ação do usuário]
  Então [resultado esperado]
    ✓ Dado seguro (sem loss de dados)
    ✓ Sincronizado (< 100ms)
    ✓ Auditado (log completo)
    ✓ Feedback (< 300ms visual)
```

**Exemples High-Priority**:
- Sniping nos últimos 10s + latência 100ms
- 50+ lances simultâneos no mesmo lote
- User com sessão expirada tentando dar lance
- Edital mudou enquanto user analisa
- Deep link de email antigo expirado

---

## 📊 Metrics to Validate

| Métrica | Target | Miss = Bug |
|---------|--------|-----------|
| Bid latency | < 2s | Timeout |
| UI response | < 300ms | Lag visual |
| Search count update | < 1s | Desync |
| WebSocket lag | < 500ms | Use polling |
| Accessibility (WCAG) | AA 100% | Falha mobile |
| Performance (CWV) | Good | User bounce |
| Audit log | 100% coverage | Compliance fail |

---

## 🚀 Integration Checklist

### Antes de PR (Code Review)
1. [ ] Rode este agent: `🕵️ SA-QA: Auditar [arquivo] blocos 1-5`
2. [ ] Exija Gherkin scenario para todas as críticas
3. [ ] Validar performance (< 500ms latency)
4. [ ] Check accessibility (keyboard + screen reader)

### Antes de Merge (QA Sign-off)
1. [ ] Testes E2E Playwright cobrem todos BDD scenarios
2. [ ] Audit log testado (IP, device, timestamp)
3. [ ] Performance score não degradou
4. [ ] Zero security warnings (CSRF, XSS, SQLi)
5. [ ] Mobile viewport 375px testado

### Before Prod Deploy
1. [ ] Rollback plan documentado
2. [ ] Feature flag configurado (killswitch ready)
3. [ ] Monitoring alerts acionados (latency, errors)
4. [ ] Database backup feito
5. [ ] Load test simulando peak traffic (leilão final)

---

## ⚡ Common Patterns to Audit

### Race Condition Detection
```typescript
// ❌ VULNERÁVEL
await prisma.bid.create({ data: { auctionId, userId, amount } });

// ✅ SEGURO
const existingBid = await prisma.bid.findUnique({ where: { auctionId_userId } });
if (!existingBid) {
  await prisma.bid.create(/* ... */);
} else {
  throw new Error("Bid already placed");
}
```

### WebSocket vs Polling
```typescript
// ✅ PREFERRED (< 500ms)
const socket = io('wss://api.bid.com');
socket.on('newBid', (data) => updateUI(data));

// ⚠️ FALLBACK (1-2s max)
setInterval(async () => {
  const latest = await fetch('/api/auction/:id/latest-bid');
  updateUI(latest);
}, 1000);
```

### Timestamp Sync Validation
```typescript
// ✅ CORRETO
const clientTime = Date.now();
const serverTime = response.headers['x-server-time'];
const diff = Math.abs(clientTime - serverTime);
if (diff > 100) console.warn(`Time skew: ${diff}ms`);
```

---

## 📞 When to Invoke This Agent

**SEMPRE que**:
- 🔴 Bug crítico em bid/search/carteira
- 🟠 Feature relacionada a leilão/investidor
- 🟡 Performance issue (> 500ms)
- 🟢 Code review de fluxos financeiros
- 🔵 Security audit de endpoints

**OPCIONALMENTE**:
- Brainstorm de UX competitor
- Análise de código legacy
- Refactoring de componentes React
- Training de novo dev em padrões da plataforma

---

**Updated**: 7/02/2026 | **Status**: ✅ Production Ready
