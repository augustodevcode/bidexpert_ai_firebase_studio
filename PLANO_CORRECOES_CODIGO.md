# 🔧 PLANO DE CORREÇÕES DE CÓDIGO - TESTES PLAYWRIGHT

## 1. CORREÇÕES CRÍTICAS - IMPLEMENTAR data-ai-id

### 1.1 Componente Lot Card
**Arquivo:** `src/components/cards/lot-card.tsx`

```tsx
// ANTES (sem data-ai-id)
<div className="lot-card">
  <div className="status-badges">Aberto para Lances</div>
  <div className="mental-triggers">LANCE QUENTE</div>
  // ...
</div>

// DEPOIS (com data-ai-id)
<div className="lot-card" data-ai-id={`lot-card-${lot.id}`}>
  <div className="status-badges" data-ai-id="lot-card-status-badges">
    Aberto para Lances
  </div>
  <div className="mental-triggers" data-ai-id="lot-card-mental-triggers">
    LANCE QUENTE • MAIS VISITADO
  </div>
  <div className="category" data-ai-id="lot-card-category">
    {lot.category?.name}
  </div>
  <div className="bid-count" data-ai-id="lot-card-bid-count">
    {lot.bidsCount} Lances
  </div>
  <div className="location" data-ai-id="lot-card-location">
    {lot.cityName} - {lot.stateUf}
  </div>
  <h3 className="title" data-ai-id="lot-card-title">
    {lot.title}
  </h3>
  <div className="footer" data-ai-id="lot-card-footer">
    R$ {Number(lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  </div>
</div>
```

### 1.2 Componente Auction Card
**Arquivo:** `src/components/cards/auction-card.tsx`

```tsx
// DEPOIS (com data-ai-id)
<div className="auction-card" data-ai-id={`auction-card-${auction.id}`}>
  <div className="seller-logo" data-ai-id="auction-card-seller-logo">
    <img src={auction.seller?.logoUrl} alt="Logo do Comitente" />
  </div>
  <h3 className="title" data-ai-id="auction-card-title">
    {auction.title}
  </h3>
  <span className="public-id" data-ai-id="auction-card-public-id">
    {auction.publicId}
  </span>
  <div className="counters" data-ai-id="auction-card-counters">
    <span>{auction.totalLots} Lotes</span>
    <span>{auction.visits} Visitas</span>
    <span>{auction.totalHabilitatedUsers} Habilitados</span>
  </div>
  <div className="footer" data-ai-id="auction-card-footer">
    R$ {Number(auction.initialOffer).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  </div>
</div>
```

### 1.3 Formulário de Login
**Arquivo:** `src/components/auth/login-form.tsx`

```tsx
// DEPOIS (com data-ai-id)
<form className="login-form">
  <input 
    type="email"
    name="email"
    data-ai-id="auth-login-email-input"
    placeholder="Email"
  />
  <input 
    type="password"
    name="password"
    data-ai-id="auth-login-password-input"
    placeholder="Senha"
  />
  <button 
    type="submit"
    data-ai-id="auth-login-submit-button"
  >
    Login
  </button>
</form>
```

### 1.4 Painel de Lances (CRIAR NOVO)
**Arquivo:** `src/components/bidding/bidding-panel.tsx`

```tsx
import React, { useState } from 'react';

interface BiddingPanelProps {
  lot: {
    id: string;
    initialPrice: number;
    currentPrice: number;
    bidIncrementStep: number;
  };
  onPlaceBid: (amount: number) => Promise<void>;
}

export function BiddingPanel({ lot, onPlaceBid }: BiddingPanelProps) {
  const [bidAmount, setBidAmount] = useState(
    lot.currentPrice + lot.bidIncrementStep
  );
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceBid = async () => {
    setIsLoading(true);
    try {
      await onPlaceBid(bidAmount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bidding-panel" data-ai-id="bidding-panel-card">
      <div className="current-price">
        <span>Preço Atual:</span>
        <strong>
          R$ {lot.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </strong>
      </div>
      
      <div className="bid-input-section">
        <label>Seu Lance:</label>
        <input
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          min={lot.currentPrice + lot.bidIncrementStep}
          step={lot.bidIncrementStep}
          data-ai-id="bid-amount-input"
        />
      </div>

      <button
        onClick={handlePlaceBid}
        disabled={isLoading || bidAmount <= lot.currentPrice}
        data-ai-id="place-bid-button"
      >
        {isLoading ? 'Processando...' : 'Dar Lance'}
      </button>

      <div className="bid-history" data-ai-id="bid-history-panel">
        <h4>Histórico Recente</h4>
        {/* Lista de lances recentes */}
      </div>
    </div>
  );
}
```

### 1.5 Página de Detalhes do Lote
**Arquivo:** `src/app/auctions/[auctionId]/lots/[lotId]/page.tsx`

```tsx
export default function LotDetailPage({ params }: { params: { auctionId: string, lotId: string } }) {
  // ... lógica de carregamento dos dados

  return (
    <div className="lot-detail-page" data-ai-id="lot-detail-page-container">
      <div className="lot-info">
        {/* Informações do lote */}
      </div>
      
      <BiddingPanel 
        lot={lot}
        onPlaceBid={handlePlaceBid}
      />
    </div>
  );
}
```

## 2. CORREÇÕES NOS TESTES

### 2.1 Corrigir Importações Dinâmicas
**Arquivo:** `tests/ui/bidding-journey.spec.ts`

```typescript
// ADICIONAR no início da função beforeAll:
test.beforeAll(async () => {
  console.log(`[Bidding Journey Test] Setting up for run: ${testRunId}`);
  
  // Importações dinâmicas
  const { createUser } = await import('../../src/app/admin/users/actions');
  const { createAuction } = await import('../../src/app/admin/auctions/actions');
  const { createLot } = await import('../../src/app/admin/lots/actions');
  const { habilitateForAuctionAction } = await import('../../src/app/admin/habilitations/actions');
  
  // ... resto do código
});
```

### 2.2 Corrigir Seletores de Login
**Arquivo:** `tests/ui/bidding-journey.spec.ts`

```typescript
// CORRIGIR na função beforeEach:
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
  
  await page.goto('/auth/login');
  
  // Usar seletores corretos
  await page.locator('[data-ai-id="auth-login-email-input"]').fill(bidderUser.email);
  await page.locator('[data-ai-id="auth-login-password-input"]').fill('password123');
  await page.locator('[data-ai-id="auth-login-submit-button"]').click();
  
  // Aguardar redirecionamento
  await page.waitForURL('/dashboard/overview', { timeout: 30000 });
});
```

## 3. IMPLEMENTAR LÓGICA DE NEGÓCIO

### 3.1 Action para Dar Lance
**Arquivo:** `src/app/auctions/[auctionId]/lots/[lotId]/actions.ts`

```typescript
'use server';

import { getSession } from '@/server/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function placeBidOnLot(lotId: string, bidAmount: number) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    // Verificar se o lote existe e está aberto para lances
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: { auction: true }
    });

    if (!lot || lot.status !== 'ABERTO_PARA_LANCES') {
      return { success: false, message: 'Lote não disponível para lances' };
    }

    // Verificar se o valor do lance é válido
    const minimumBid = (lot.currentPrice || lot.initialPrice) + (lot.bidIncrementStep || 50);
    if (bidAmount < minimumBid) {
      return { success: false, message: `Lance mínimo: R$ ${minimumBid}` };
    }

    // Criar o lance
    const bid = await prisma.bid.create({
      data: {
        userId: session.userId,
        lotId: lotId,
        amount: bidAmount,
        tenantId: session.tenantId
      }
    });

    // Atualizar o preço atual do lote
    await prisma.lot.update({
      where: { id: lotId },
      data: { 
        currentPrice: bidAmount,
        bidsCount: { increment: 1 }
      }
    });

    revalidatePath(`/auctions/${lot.auctionId}/lots/${lotId}`);
    
    return { success: true, message: 'Lance realizado com sucesso!', bidId: bid.id };
  } catch (error) {
    console.error('Erro ao dar lance:', error);
    return { success: false, message: 'Erro interno do servidor' };
  }
}
```

### 3.2 Componente de Toast para Feedback
**Arquivo:** `src/components/ui/toast.tsx` (se não existir)

```tsx
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' && <span>Sucesso!</span>}
      {type === 'error' && <span>Erro!</span>}
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}
```

## 4. MELHORIAS DE PERFORMANCE

### 4.1 Adicionar Loading States
**Arquivo:** `src/components/ui/loading-spinner.tsx`

```tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`loading-spinner loading-spinner-${size}`} data-ai-id="loading-spinner">
      <div className="spinner"></div>
    </div>
  );
}
```

### 4.2 Implementar Lazy Loading
**Arquivo:** `src/components/cards/lot-card.tsx`

```tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../ui/loading-spinner';

const LazyLotImage = lazy(() => import('./lot-image'));

export function LotCard({ lot }: { lot: Lot }) {
  return (
    <div className="lot-card" data-ai-id={`lot-card-${lot.id}`}>
      <Suspense fallback={<LoadingSpinner />}>
        <LazyLotImage src={lot.imageUrl} alt={lot.title} />
      </Suspense>
      {/* resto do componente */}
    </div>
  );
}
```

## 5. CHECKLIST DE IMPLEMENTAÇÃO

### Prioridade ALTA (Esta Semana):
- [ ] Implementar `data-ai-id` em lot-card.tsx
- [ ] Implementar `data-ai-id` em auction-card.tsx
- [ ] Implementar `data-ai-id` em login-form.tsx
- [ ] Corrigir importações dinâmicas em bidding-journey.spec.ts
- [ ] Criar componente BiddingPanel básico

### Prioridade MÉDIA (Próxima Semana):
- [ ] Implementar action placeBidOnLot
- [ ] Criar página de detalhes do lote
- [ ] Implementar sistema de toast
- [ ] Adicionar loading states
- [ ] Otimizar performance de carregamento

### Prioridade BAIXA (Futuro):
- [ ] Implementar lazy loading
- [ ] Adicionar testes unitários
- [ ] Melhorar UX dos componentes
- [ ] Implementar cache de dados

## 6. COMANDOS PARA TESTAR

```bash
# Testar componente específico
npx playwright test tests/ui/universal-card-content.spec.ts --headed

# Testar jornada de lances
npx playwright test tests/ui/bidding-journey.spec.ts --headed

# Executar todos os testes
npx playwright test tests/ui --headed --workers=1

# Gerar relatório
npx playwright show-report
```

---

**Próxima Revisão:** Após implementação das correções críticas  
**Meta:** 70%+ de testes passando na próxima execução
