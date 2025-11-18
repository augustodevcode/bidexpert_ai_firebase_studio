# 🔧 PLANO DE EXECUÇÃO - PRÓXIMAS 2 SEMANAS

## SEMANA 1 - Validação e Testes Base

### Dia 1 (Hoje) - Setup e Auditoria Multi-Tenant
**Tempo:** 4-5 horas

#### 1. Auditoria Multi-Tenant (2-3h)
```bash
# TAREFAS:
[ ] Revisar middleware.ts - validação de tenantId
[ ] Auditar 10 principais queries em Prisma
[ ] Testar: user A acessa dados user B? (deve falhar)
[ ] Verificar Server Actions incluem tenantId
[ ] Documentar achados
```

**Checklist de Segurança:**
- [ ] Session contém tenantId
- [ ] Todas as queries filtram `where: { tenantId }`
- [ ] Server Actions validam `session.tenantId`
- [ ] API routes checam `authorization header`

#### 2. Setup Servidor de Teste (1h)
```bash
# Ambiente:
- [ ] Branch staging criado
- [ ] Database staging populado
- [ ] .env.staging configurado
- [ ] Server rodando em porta testing
```

#### 3. Primeiro Teste E2E (2h)
```typescript
// tests/e2e/01-auth.spec.ts
- [ ] Login com credenciais válidas
- [ ] Logout funciona
- [ ] Redireciona para login se não autenticado
- [ ] Preserva sessão após refresh
```

### Dia 2-3 - Testes Core CRUD
**Tempo:** 8-10 horas

#### 1. Auction CRUD Tests (4h)
```typescript
// tests/e2e/02-auction-crud.spec.ts
- [ ] Criar auditoria
- [ ] Listar auditorias
- [ ] Editar auditoria
- [ ] Deletar auditoria
- [ ] Validações de campo
```

**Data-AI-ID necessários:**
```
auction-title-input
auction-description-textarea
auction-status-select
auction-submit-btn
auction-cancel-btn
auction-delete-btn
```

#### 2. Lot CRUD Tests (4h)
```typescript
// tests/e2e/03-lot-crud.spec.ts
- [ ] Criar lote
- [ ] Listar lotes
- [ ] Editar lote
- [ ] Deletar lote
- [ ] Upload imagens
```

### Dia 4-5 - Fluxos Críticos
**Tempo:** 8-10 horas

#### 1. Bidding Flow (4h)
```typescript
// tests/e2e/04-bidding.spec.ts
- [ ] Fazer lance em lote aberto
- [ ] Ver feedback (spinner + toast)
- [ ] Não deixa baixar lance
- [ ] Validações de valor
- [ ] Histórico de lances
```

#### 2. Payment Flow (4h)
```typescript
// tests/e2e/05-payment.spec.ts
- [ ] Checkout boleto
- [ ] Checkout cartão
- [ ] Installments
- [ ] Confirmação pagamento
```

---

## SEMANA 2 - Responsividade e Polimento

### Dia 6-7 - Responsividade
**Tempo:** 8-10 horas

```typescript
// tests/e2e/06-responsive.spec.ts

// Viewport 320px (Mobile)
[ ] Teste 5 componentes críticos
[ ] Menu hambúrguer funciona
[ ] Imagens responsive
[ ] Formulários stack vertical

// Viewport 768px (Tablet)
[ ] Grid 2 colunas
[ ] Modals fullscreen
[ ] Tabelas scroll horizontal

// Viewport 1024px+ (Desktop)
[ ] Grid 3+ colunas
[ ] Modals centered
[ ] Tabelas full width
```

### Dia 8-10 - Bug Fixes e Regressão
**Tempo:** 10-12 horas

```bash
[ ] Rodar todos os testes 5x
[ ] Documentar bugs encontrados
[ ] Priorizar por impacto
[ ] Fixar críticos (P0)
[ ] Regressão dos fixes

# Testes de estresse:
[ ] 1000 requisições simultâneas
[ ] Database stress test
[ ] Memory leaks check
[ ] Connection pool tests
```

---

## IMPLEMENTAÇÃO DATA-AI-ID (Paralelo)

### Formulários (5-6h) - Começar hoje

#### Auction Form (2h)
```tsx
// src/app/admin/auctions/new/page.tsx
Adicionar data-ai-id em:
- auction-title-input
- auction-date-startpicker-trigger
- auction-date-endpicker-trigger
- auction-modality-select
- auction-status-select
- auction-location-select
- auction-seller-select
- auction-seller-search-input
- auction-submit-btn
- auction-cancel-btn
- (+ 10 mais)
```

#### Lot Form (2h)
```tsx
// src/app/admin/lots/new/page.tsx
- lot-title-input
- lot-description-textarea
- lot-category-select
- lot-location-select
- lot-starting-price-input
- lot-auction-select
- lot-submit-btn
- (+ 10 mais)
```

#### Action Buttons (1h)
```tsx
// Em todo app
- lot-bid-btn
- auction-edit-btn
- lot-delete-btn
- favorite-toggle-btn
- share-btn
- (+ mais)
```

---

## CHECKLIST DIÁRIO

### Cada dia, verificar:

```
[ ] Testes passando
[ ] Sem novos erros TypeScript
[ ] Código compilado
[ ] Performance mantida
[ ] Nenhum breaking change
```

### Commit padrão:
```bash
git commit -m "test: add e2e tests for [feature]

- [x] Test 1
- [x] Test 2
- [x] Data-AI-ID added: 10 selectors

Coverage: 85%
Status: Ready for review"
```

---

## MÉTRICAS DE SUCESSO

### Dia 5 (fim semana 1):
- [ ] ≥ 20 testes E2E passando
- [ ] ≥ 50 data-ai-id em forms
- [ ] Multi-tenant auditado
- [ ] Bugs P0 fixados

### Dia 10 (fim semana 2):
- [ ] ≥ 40 testes E2E passando
- [ ] Responsividade 3 viewports testada
- [ ] ≥ 95% código coverage
- [ ] Zero bugs P0/P1 abertos
- [ ] Pronto para staging

---

## ESCALAÇÃO (Se problemas)

### Se encontrar bug crítico:
1. Documentar em issue
2. Marcar como P0/P1
3. Fix tem prioridade
4. Rerun todos os testes após fix
5. Não continuar novos trabalhos

### Se arquitetura está errada:
1. Parar testes
2. Discutir com arquiteto
3. Planejar refactor
4. Estimar impacto
5. Retomar testes

---

## RESULTADO ESPERADO

### Fim da semana 2:
✅ Plataforma completamente testada  
✅ Data-AI-ID 100% implementado  
✅ Responsividade validada  
✅ Multi-tenant seguro  
✅ Pronto para staging  

### Semana 3:
Apenas polimento fino + deployment prep
