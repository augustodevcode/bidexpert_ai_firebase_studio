# ✅ AÇÕES IMEDIATAS - PRÓXIMOS 7 DIAS

## 🔴 DIA 1 (HOJE) - PRIORIDADES ALTAS

### Task 1: Auditoria Multi-Tenant (2-3 horas)
**Arquivo:** COMECE AQUI - `src/lib/auth.ts`

```typescript
// 1. Verificar: Session contém tenantId?
// Abrir: src/lib/auth.ts
// Procurar por: encode/decode JWT
// Validar: tenantId está incluído no payload
// ✅ Se OK: tenantId presente
// ❌ Se não: Critical bug

// 2. Verificar: Middleware valida tenantId?
// Abrir: middleware.ts
// Procurar por: session.tenantId check
// Validar: Toda rota protegida valida tenantId
// ✅ Se OK: Validação presente
// ❌ Se não: Security hole

// 3. Verificar: Queries Prisma filtram tenantId?
// Abrir: src/services/*.ts
// Procurar por: where: { tenantId }
// Contar quantas queries fazem filter
// ✅ Se >80%: Good
// ⚠️ Se <80%: Audit needed
// ❌ Se 0%: CRITICAL

// 4. TESTE PRÁTICO:
// 1. Login como user A (tenant A)
// 2. Pegar ID do objeto do user A
// 3. Usar devtools para chamar API com objeto user B
// 4. Resultado: Deve retornar 403/404 (NOT ACCESS)
// ✅ Se sim: Seguro
// ❌ Se consegue acessar: CRITICAL BUG
```

**Checklist:**
- [ ] JWT possui tenantId
- [ ] Middleware valida tenantId
- [ ] ≥80% queries filtram tenantId
- [ ] Teste prático passou
- [ ] Documentar em AUDITORIA_MULTITENANT.md

---

### Task 2: Primeiro Teste E2E (2 horas)
**Arquivo NOVO:** `tests/e2e/01-auth.spec.ts`

```typescript
// Copiar template abaixo e preencher

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    // 1. Navegar
    await page.goto('http://localhost:9002/auth/login');
    
    // 2. Preencher form
    await page.fill('[data-ai-id="auth-email-input"]', 'admin@bidexpert.com');
    await page.fill('[data-ai-id="auth-password-input"]', 'senha123');
    
    // 3. Clicar submit
    await page.click('[data-ai-id="auth-submit-btn"]');
    
    // 4. Esperar redirecionar
    await page.waitForURL('**/dashboard');
    
    // 5. Validar
    expect(page.url()).toContain('/dashboard');
  });

  test('should logout', async ({ page }) => {
    // Similar: login → clique logout → verificar redirect para login
  });

  test('should persist session after refresh', async ({ page }) => {
    // Similar: login → refresh page → ainda logado?
  });
});
```

**Checklist:**
- [ ] Arquivo criado em tests/e2e/
- [ ] 3 testes básicos implementados
- [ ] Rode: `npx playwright test`
- [ ] Todos 3 testes passam (3/3 ✅)
- [ ] Documentar tempo: X minutos

---

### Task 3: Começar Data-AI-ID em Forms (1 hora)
**Arquivo:** `src/app/admin/auctions/new/page.tsx`

```typescript
// 1. Encontre input de titulo:
// Procure por: <input ... placeholder="Título"
// Adicione: data-ai-id="auction-title-input"

// 2. Encontre input de data início:
// Procure por: <input ... type="date"
// Adicione: data-ai-id="auction-date-start-input"

// 3. Encontre select de modality:
// Procure por: <select ... defaultValue={...}
// Adicione: data-ai-id="auction-modality-select"

// 4. Encontre button submit:
// Procure por: <button ... type="submit"
// Adicione: data-ai-id="auction-submit-btn"

// 5. Encontre button cancel:
// Procure por: <button ... onClick={...back
// Adicione: data-ai-id="auction-cancel-btn"

// Padrão: data-ai-id="auction-{fieldname}-{type}"
// Exemplos:
// - data-ai-id="auction-title-input"
// - data-ai-id="auction-date-start-picker"
// - data-ai-id="auction-modality-select"
// - data-ai-id="auction-submit-btn"
```

**Checklist:**
- [ ] Adicionados 5 data-ai-id em auction form
- [ ] Código compila sem erros
- [ ] Nenhum breaking change
- [ ] Documento lista os 5 IDs adicionados

---

## 🟡 DIAS 2-3 (CRUD TESTS) - 8-10 HORAS

### Task 4: Auction CRUD E2E (4 horas)
**Arquivo NOVO:** `tests/e2e/02-auction-crud.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Auction CRUD', () => {
  test('CREATE: should create new auction', async ({ page }) => {
    await page.goto('http://localhost:9002/admin/auctions/new');
    
    // Preencher form
    await page.fill('[data-ai-id="auction-title-input"]', 'Leilão Teste');
    await page.fill('[data-ai-id="auction-date-start-input"]', '2025-12-01');
    await page.fill('[data-ai-id="auction-date-end-input"]', '2025-12-31');
    // ... mais campos
    
    // Submit
    await page.click('[data-ai-id="auction-submit-btn"]');
    
    // Validar
    await expect(page).toHaveURL('**/auctions/**');
    await expect(page.locator('text=Leilão Teste')).toBeVisible();
  });

  test('READ: should list auctions', async ({ page }) => {
    // Navegar para lista
    // Verificar > 0 auctions visíveis
    // Clicar em 1 auction
    // Verificar detalhes
  });

  test('UPDATE: should edit auction', async ({ page }) => {
    // Navegar para edit
    // Mudar campo
    // Salvar
    // Verificar mudança
  });

  test('DELETE: should delete auction', async ({ page }) => {
    // Navegar para delete
    // Confirmar delete
    // Verificar desapareceu da lista
  });
});
```

**Checklist:**
- [ ] Arquivo criado: tests/e2e/02-auction-crud.spec.ts
- [ ] 4 testes implementados (CREATE/READ/UPDATE/DELETE)
- [ ] Dados do DB populados com teste válido
- [ ] Todos 4 testes passam
- [ ] Documentar tempo de execução

---

### Task 5: Lot CRUD E2E (4 horas)
**Arquivo NOVO:** `tests/e2e/03-lot-crud.spec.ts`

Mesma estrutura que Auction CRUD, mas com:
- Navegar para `/admin/lots/new`
- Campos: title, description, category, location, starting_price
- Data-AI-IDs: `lot-title-input`, `lot-category-select`, etc

**Checklist:**
- [ ] Arquivo criado: tests/e2e/03-lot-crud.spec.ts
- [ ] 4 testes implementados
- [ ] Todos 4 passam
- [ ] Tempo documentado

---

## 🟠 DIAS 4-5 (FLUXOS CRÍTICOS) - 8-10 HORAS

### Task 6: Bidding Flow (4 horas)
**Arquivo NOVO:** `tests/e2e/04-bidding.spec.ts`

```typescript
test.describe('Bidding Flow', () => {
  test('should place bid successfully', async ({ page }) => {
    // 1. Navegar para lot aberto
    // 2. Clicar em "Fazer Lance"
    // 3. Preencher valor
    // 4. Esperar spinner
    // 5. Validar toast de sucesso
    // 6. Verificar novo valor em topo
  });

  test('should not allow bid lower than current', async ({ page }) => {
    // Lance com valor MENOR que atual
    // Deve mostrar erro
  });

  test('should show bid history', async ({ page }) => {
    // Fazer 3 lances
    // Verificar aparecem em histórico
    // Ordem: mais recente primeiro
  });
});
```

**Checklist:**
- [ ] 3 testes implementados
- [ ] Todos passam
- [ ] Spinner animação testada
- [ ] Toast notification validada
- [ ] Erro de bid baixo testado

---

### Task 7: Payment Flow (4 horas)
**Arquivo NOVO:** `tests/e2e/05-payment.spec.ts`

```typescript
test.describe('Payment Flow', () => {
  test('should generate boleto', async ({ page }) => {
    // Clicar "Pagar"
    // Selecionar "Boleto"
    // Validar código boleto gerado
    // Verificar vencimento
  });

  test('should allow installments', async ({ page }) => {
    // Selecionar 3 parcelas
    // Validar valor × 3
    // Validar juros calculados
  });

  test('should confirm payment', async ({ page }) => {
    // Pagar
    // Sistema confirma
    // Status muda para "Pago"
  });
});
```

**Checklist:**
- [ ] 3 testes implementados
- [ ] Boleto gerado com sucesso
- [ ] Installments calculam corretamente
- [ ] Confirmação funciona

---

## 📊 RESUMO DIAS 1-5

### Esperado ao fim de DIA 5:
- ✅ Auditoria multi-tenant iniciada
- ✅ 3 testes auth passando
- ✅ 4 testes auction CRUD passando
- ✅ 4 testes lot CRUD passando
- ✅ 3 testes bidding passando
- ✅ 3 testes payment passando
- ✅ **Total: 20 testes E2E passando**
- ✅ 15-20 data-ai-id adicionados em forms

### Comando para validar:
```bash
cd /path/to/bidexpert
npx playwright test --reporter=html
# Abrir: playwright-report/index.html
# Esperado: 20/20 tests passed ✅
```

---

## 📋 DAILY CHECKLIST

Copie e preencha **todo dia**:

```markdown
## DIA X (Data)

### Status Geral
[ ] Compilação OK
[ ] Testes rodando
[ ] Nenhum novo bug P0
[ ] Commits feitos
[ ] Documentação atualizada

### Progresso Hoje
- ✅ O que fiz:
- ⏳ O que fará amanhã:
- 🔴 Bloqueadores:
- 📊 Números: X testes, Y data-ai-ids

### Próxima Ação
[ ] Descrição
```

---

## 🆘 PRECISA DE AJUDA?

**Se encontrar erro TypeScript:**
```bash
# Limpe build cache
npm run clean
npm run build
```

**Se teste falhar:**
```bash
# Rode com debug
npx playwright test --debug
# Mode: Abrir in inspector, step-by-step
```

**Se SQL error:**
```bash
# Check database
npx prisma studio
# Ou rodar migration
npx prisma migrate dev
```

**Se data-ai-id não funciona:**
```bash
# Verifique no Playwright:
page.screenshot() // Visual check
page.locator('[data-ai-id="xyz"]').isVisible() // Debug
```

---

## 🎯 META FINAL

**DIA 5 (Sexta à noite):**
```
✅ 20/20 testes E2E passando
✅ 50/120 data-ai-ids implementados  
✅ Auditoria multi-tenant 80% completa
✅ 0 bugs P0 abertos
✅ README.md updated

Status: 🟢 ON TRACK
```

---

**Comece pelo TASK 1 (Auditoria). Você consegue! 💪**
