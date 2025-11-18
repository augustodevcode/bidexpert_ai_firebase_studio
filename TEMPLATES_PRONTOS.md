# 📄 TEMPLATES PRONTOS PARA USAR

## Template 1: Arquivo Auditoria Multi-Tenant

**Copie e salve como:** `AUDITORIA_MULTITENANT.md`

```markdown
# 🔒 Auditoria Multi-Tenant - BidExpert

## Data: [DATA]
## Auditor: [NOME]
## Status: ⏳ EM PROGRESSO

---

## 1. JWT Session Check ✅/❌

### Verificação: Session contém tenantId?

**Arquivo:** src/lib/auth.ts
**Resultado:** [✅ Sim / ❌ Não]
**Detalhe:**
```typescript
// JWT payload esperado:
{
  sub: "user-id",
  email: "user@example.com",
  tenantId: "tenant-123",  // <-- Deve estar aqui
  iat: 123456,
  exp: 789012
}
```

**Encontrado:**
[ ] tenantId presente em encode()
[ ] tenantId presente em decode()
[ ] tenantId em claimns validados

---

## 2. Middleware Validation ✅/❌

### Verificação: Toda rota protegida valida tenantId?

**Arquivo:** middleware.ts
**Resultado:** [✅ Sim / ❌ Não]

**Padrão esperado:**
```typescript
// Para rotas protegidas:
if (!session?.tenantId) {
  return new NextResponse('Unauthorized', { status: 401 });
}

// Para acesso a recurso:
if (resourceTenantId !== session.tenantId) {
  return new NextResponse('Forbidden', { status: 403 });
}
```

**Validações:**
[ ] Middleware existe e está ativo
[ ] Dashboard route protegida
[ ] API routes protegidas
[ ] Admin routes protegidas

---

## 3. Prisma Queries Audit ✅/❌

### Verificação: Queries filtram por tenantId?

**Arquivo:** src/services/
**Resultado:** [✅ ≥80% / ⚠️ 50-80% / ❌ <50%]

### Query Analysis:

#### Service 1: [NOME]
```
Total queries: X
Com tenantId: Y
Percentual: Y/X = Z%
Status: [✅/⚠️/❌]
```

**Exemplo OK:**
```typescript
const auctions = await prisma.auction.findMany({
  where: {
    tenantId: session.tenantId,  // <-- Filtro crítico
    status: 'OPEN'
  }
});
```

**Exemplo ERRADO:**
```typescript
const auctions = await prisma.auction.findMany({
  where: {
    status: 'OPEN'  // <-- FALTA tenantId!
  }
});
```

### Checklist Queries:
- [ ] AuctionService queries auditadas
- [ ] LotService queries auditadas
- [ ] BidService queries auditadas
- [ ] UserService queries auditadas
- [ ] PaymentService queries auditadas

---

## 4. Teste Prático: Cross-Tenant Access ✅/❌

### Verificação: User A consegue acessar dados de User B?

**Resultado:** [✅ NÃO consegue / ❌ CONSEGUE = CRITICAL]

### Procedimento Teste:

1. **Login como User A (Tenant A)**
   ```bash
   Email: user-a@tenant-a.com
   Password: senha123
   ```
   Status: ✅ Logado

2. **Obter ID de recurso do User B (Tenant B)**
   ```bash
   Lot ID: lot-999
   Auction ID: auction-888
   ```

3. **Usar DevTools para chamar API**
   ```bash
   GET /api/lots/999
   Headers: [cookie com session User A]
   ```

4. **Resultado Esperado:**
   - ✅ 403 Forbidden OU
   - ✅ 404 Not Found
   - ❌ 200 + dados = CRÍTICO!

**Teste executado:** [ ] Sim / [ ] Não
**Resultado:** [✅ Seguro / ❌ INSEGURO]
**Detalhes:**
```
Request: GET /api/lots/999
Response Status: 403
Response Body: {"error": "Forbidden"}
Conclusão: ✅ Acesso negado corretamente
```

---

## 5. Server Actions Audit ✅/❌

### Verificação: Server Actions validam tenantId?

**Arquivos:** src/app/**/actions.ts
**Resultado:** [✅ Sim / ❌ Não]

**Padrão esperado:**
```typescript
'use server';

export async function updateAuction(id: string, data: any) {
  const session = await getSession();
  
  if (!session?.tenantId) {
    throw new Error('Unauthorized');
  }
  
  const auction = await prisma.auction.findUnique({
    where: { id },
  });
  
  // Verificar posse
  if (auction.tenantId !== session.tenantId) {
    throw new Error('Forbidden');
  }
  
  // Atualizar
  return await prisma.auction.update({
    where: { id },
    data,
  });
}
```

**Server Actions verificadas:**
- [ ] createAuction - valida tenantId
- [ ] updateAuction - valida tenantId
- [ ] deleteAuction - valida tenantId
- [ ] placeBid - valida tenantId
- [ ] processPayment - valida tenantId

---

## 6. Relatório Final

### Vulnerabilidades Críticas: [X]
```
1. [Descrição]
   Severidade: 🔴 CRÍTICO
   Risco: [Alto/Médio/Baixo]
   Fix: [O que fazer]
   Tempo: [X horas]
```

### Vulnerabilidades Médias: [Y]
```
1. [Descrição]
   Severidade: 🟡 MÉDIO
   Risco: [Alto/Médio/Baixo]
```

### Recomendações: [Z]
```
1. [Recomendação]
2. [Recomendação]
3. [Recomendação]
```

---

## Status Final

- [ ] Sem vulnerabilidades críticas
- [ ] Multi-tenant isolado corretamente
- [ ] Pronto para produção

**Assinado por:** [NOME]
**Data:** [DATA]
**Próximo review:** [DATA]
```

---

## Template 2: Test Report Diário

**Copie e salve como:** `TESTE_REPORT_DIA_X.md`

```markdown
# 📊 Teste Report - Dia X

**Data:** [DATA]
**Executor:** [NOME]
**Duração:** [X horas]

---

## Resumo Executivo

| Métrica | Resultado |
|---------|-----------|
| Testes Criados | X |
| Testes Passando | Y/X |
| Pass Rate | Y% |
| Bugs Encontrados | Z |
| P0/P1 Bugs | A/Z |

---

## Testes Implementados

### ✅ Passou

```
[01-auth.spec.ts]
✅ login with valid credentials
✅ logout
✅ persist session after refresh

[02-auction-crud.spec.ts]
✅ create new auction
❌ (FALHOU - ver abaixo)
```

### ❌ Falhou

```
[02-auction-crud.spec.ts]
❌ READ: should list auctions
  Error: Timeout waiting for URL /auctions/**
  Causa: API lenta (3s timeout)
  Fix: Aumentar timeout ou otimizar API
  
❌ CREATE: should create new auction
  Error: Missing data-ai-id="auction-title-input"
  Causa: Form field não tem selector
  Fix: Adicionar data-ai-id no form
```

---

## Bugs Encontrados

### 🔴 P0 - CRÍTICO

```
[BUG-001] Login não valida email format
Arquivo: src/app/auth/login/page.tsx
Linha: 45
Impacto: User consegue fazer login com "abc"
Status: ⏳ Em análise
```

### 🟠 P1 - ALTO

```
[BUG-002] Spinner não desaparece após sucesso
Arquivo: src/components/BidForm.tsx
Impacto: UX confusa
Status: ⏳ Reportado
```

### 🟡 P2 - MÉDIO

```
[BUG-003] Date picker não mostra ano 2025
Arquivo: src/components/DatePicker.tsx
Impacto: Limita seleção
Status: ⏳ Não crítico
```

---

## Data-AI-ID Progress

### Adicionados Hoje

```
auction-title-input ✅
auction-date-start-input ✅
auction-modality-select ✅
auction-submit-btn ✅
auction-cancel-btn ✅
```

**Total:** 5 seletores  
**Acumulado:** 35 seletores (de 120)  
**Percentual:** 29%

---

## Próximas Ações

- [ ] Fixar BUG-001 (hoje)
- [ ] Fixar BUG-002 (amanhã)
- [ ] Completar 4 testes Auction CRUD (amanhã)
- [ ] Adicionar 10 data-ai-id em lot form (amanhã)

---

## Performance Notas

```
Login Flow: 450ms ✅
Auction Load: 1.2s ⚠️
Bid Submit: 800ms ✅
Payment: 2.3s ⚠️

Ação: Investigar Auction Load e Payment APIs
```

---

**Report de:** [NOME]  
**Horário:** [HH:MM]  
**Próximo:** Amanhã 18h
```

---

## Template 3: Git Commit Padrão

```bash
# Formato de commit:

git commit -m "test: add e2e tests for auction CRUD

- Implement CREATE test: new auction form
- Implement READ test: list auctions page
- Implement UPDATE test: edit auction modal
- Implement DELETE test: delete confirmation
- Add 5 data-ai-id selectors

Status: 4/4 tests passing
Coverage: 85%
Bugs: None critical"

# Outro exemplo:
git commit -m "feat: add data-ai-id to auction form

Add accessibility selectors for E2E automation:
- auction-title-input
- auction-date-start-picker
- auction-modality-select
- auction-submit-btn
- auction-cancel-btn

No functional changes"

# Fix commit:
git commit -m "fix: add tenantId filter to auction queries

Missing tenantId filter allowed cross-tenant data access.
Added where: { tenantId: session.tenantId } to:
- findMany()
- findUnique()
- updateMany()
- deleteMany()

Status: All queries audited
Security: Critical"
```

---

## Template 4: Daily Standup

**Copie e preencha todo dia às 18h:**

```markdown
## Daily Standup - Dia X ([DATA])

### O que fiz ontem:
- ✅ Criado teste auth flow (3 testes, 3 passando)
- ✅ Adicionado 5 data-ai-id em auction form
- ⚠️ Iniciado auditoria multi-tenant

### O que faço hoje:
- [ ] Completar auditoria multi-tenant (2h)
- [ ] Criar testes auction CRUD (4h)
- [ ] Adicionar 10 data-ai-id (1h)

### Bloqueadores:
- ⏳ [BUG-001] Form validation não funciona
  - Impacto: Testes falham
  - Solução: Aguardando code review

### Números:
- Testes: 3/20 (15%)
- Data-AI-IDs: 5/50 (10%)
- Bugs: 1 P0, 0 P1

### Status Geral: 🟡 ON TRACK (ligeiro atraso)

### Próxima reunião: Amanhã 18h
```

---

**Pronto para usar! Copie, preencha e compartilhe.**
