# 📋 COMPONENTES COM DATA-AI-ID - STATUS ATUAL

## ✅ IMPLEMENTADOS (Com data-ai-id)

### Cards
- ✅ `src/components/cards/auction-card.tsx` - Completo (9+ seletores)
- ✅ `src/components/cards/lot-card.tsx` - Completo (9+ seletores)

### Outros
- ✅ `src/app/auctioneers/[auctioneerSlug]/page.tsx` - Parcial (loading spinner)
- ✅ `src/components/auction/auction-info-panel.tsx` - Parcial (logo pequeno)
- ✅ `src/app/auctions/[auctionId]/components/auction-stats-card.tsx` - Nenhum

---

## 🔴 NÃO IMPLEMENTADOS (Faltam data-ai-id)

### Filtros
- ❌ `src/components/BidExpertFilter.tsx` - **CRÍTICO**
  - Faltam: filter-button, category-select, price-range, location-checkbox, seller-checkbox, status-checkbox, date-picker, apply-button, reset-button

### Formulários (CRUD)
- ❌ `src/app/admin/auctions/new/page.tsx` - Form de criar leilão
- ❌ `src/app/admin/lots/new/page.tsx` - Form de criar lote
- ❌ `src/app/admin/auctions/[auctionId]/edit/page.tsx` - Form de editar leilão

### Componentes de Busca
- ❌ `src/app/search/page.tsx` - Search box, results
- ❌ `src/app/direct-sales/page.tsx` - Search, filter, results

### Modals/Dialogs
- ❌ `src/components/dialogs/*` - Action modals
- ❌ `src/components/sheets/*` - Sheet modals

### Tabelas (Admin)
- ❌ `src/app/admin/**/*table*.tsx` - DataTable actions

### Buttons Críticos
- ❌ Create buttons
- ❌ Edit buttons
- ❌ Delete buttons
- ❌ Action buttons (bid, buy now, etc)

---

## 🎯 PRIORIDADE DE IMPLEMENTAÇÃO

### Tier 1 (Bloqueador de E2E Tests)
1. `BidExpertFilter.tsx` - 10 seletores
2. Form fields in `admin/auctions/new` - 15+ seletores
3. Form fields in `admin/lots/new` - 15+ seletores
4. Create/Edit buttons across pages - 20+ seletores

### Tier 2 (Necessário para testes completos)
5. Search/Direct Sales pages - 10+ seletores
6. Modal/Dialog triggers - 15+ seletores
7. Action buttons (bid, buy now) - 10+ seletores

### Tier 3 (Aprimoramentos)
8. Tabelas administrativas
9. Componentes secundários

---

## 📝 PADRÃO RECOMENDADO

```typescript
// Format: data-ai-id="entity-action"

// Filters
<button data-ai-id="filter-apply-btn">Aplicar Filtros</button>
<button data-ai-id="filter-reset-btn">Limpar Filtros</button>
<select data-ai-id="filter-category-select">
<input data-ai-id="filter-price-min-input" />
<input data-ai-id="filter-price-max-input" />
<div data-ai-id="filter-price-range-slider">
<checkbox data-ai-id="filter-location-${location}-checkbox" />
<checkbox data-ai-id="filter-seller-${seller}-checkbox" />
<date-picker data-ai-id="filter-start-date-picker" />
<date-picker data-ai-id="filter-end-date-picker" />

// Forms
<input data-ai-id="auction-title-input" />
<input data-ai-id="auction-date-input" />
<select data-ai-id="auction-type-select" />
<textarea data-ai-id="auction-description-textarea" />
<button data-ai-id="auction-submit-btn">Criar/Salvar</button>

// Cards/Lists
<div data-ai-id="lot-card-${lot.id}">
<button data-ai-id="lot-card-${lot.id}-favorite">Favoritar</button>
<button data-ai-id="lot-card-${lot.id}-bid">Fazer Lance</button>

// Modals
<div data-ai-id="confirmation-modal">
<button data-ai-id="confirmation-modal-confirm-btn">Confirmar</button>
<button data-ai-id="confirmation-modal-cancel-btn">Cancelar</button>

// Tables
<button data-ai-id="lot-row-${lot.id}-edit-btn">Editar</button>
<button data-ai-id="lot-row-${lot.id}-delete-btn">Deletar</button>
```

---

## ✅ PRÓXIMAS AÇÕES

1. [ ] Atualizar `BidExpertFilter.tsx` com 10+ data-ai-id
2. [ ] Atualizar forms de criação/edição (50+ data-ai-id)
3. [ ] Atualizar buttons críticos (30+ data-ai-id)
4. [ ] Criar teste Playwright que valida presença de todos os seletores
5. [ ] Adicionar verificação CI/CD para seletores obrigatórios

---

## 📊 ESTIMATIVA

- **BidExpertFilter:** 30 minutos
- **Auction Form:** 45 minutos
- **Lot Form:** 45 minutos
- **Critical Buttons:** 30 minutos
- **Testing & Validation:** 1 hora

**Total: ~3.5 horas**
