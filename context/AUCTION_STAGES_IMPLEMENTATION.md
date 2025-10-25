# ✅ Implementação com AuctionStages

## 🎯 Correção Implementada

A seção "Encerrando em Breve" agora busca a data de encerramento da **última etapa do leilão** (AuctionStage), não mais do campo `endDate` do Lot.

## 📊 Estrutura de Dados

```
Lot (Lote)
  └─> Auction (Leilão)
        └─> AuctionStage[] (Etapas)
              └─> endDate (Data de encerramento da etapa)
```

## 🔄 Mudanças Implementadas

### 1. **Arquivo: `src/app/page.tsx`**

**Antes:**
```typescript
const closingSoonLots = lotsData.filter(lot => {
  if (!lot.endDate || lot.status !== 'ABERTO_PARA_LANCES') return false;
  const endDate = new Date(lot.endDate);
  return endDate > now && endDate <= sevenDaysFromNow;
});
```

**Depois:**
```typescript
const closingSoonLotsWithStages = await prisma.lot.findMany({
  where: {
    status: 'ABERTO_PARA_LANCES',
    auction: {
      stages: {
        some: {
          endDate: {
            gte: now,
            lte: sevenDaysFromNow,
          }
        }
      }
    }
  },
  include: {
    auction: {
      include: {
        stages: {
          orderBy: { endDate: 'desc' },
          take: 1, // Última etapa
        }
      }
    }
  },
  take: 8,
});

// Mapear para usar a data da última etapa
const closingSoonLots = closingSoonLotsWithStages.map(lot => ({
  ...lot,
  endDate: lot.auction?.stages[0]?.endDate || lot.endDate,
}));
```

### 2. **Novo Script: `scripts/seed-closing-with-stages.ts`**

Cria leilões completos com:
- ✅ Auction (Leilão)
- ✅ AuctionStage (2ª Praça) com datas específicas
- ✅ 2 Lots por leilão vinculados

## 📊 Dados Criados

Executei o script que criou:
- **6 leilões** com etapas
- **12 lotes** vinculados
- **6 etapas** (2ª Praça) encerrando em:
  - 12 horas (Urgente)
  - 24 horas (1 dia)
  - 48 horas (2 dias)
  - 72 horas (3 dias)
  - 120 horas (5 dias)
  - 168 horas (7 dias)

## 🔍 Query SQL Equivalente

```sql
SELECT 
  l.*,
  a.title as auction_title,
  s.name as stage_name,
  s.endDate as stage_end_date
FROM Lot l
INNER JOIN Auction a ON l.auctionId = a.id
INNER JOIN AuctionStage s ON s.auctionId = a.id
WHERE 
  l.status = 'ABERTO_PARA_LANCES'
  AND s.endDate >= NOW()
  AND s.endDate <= DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY s.endDate ASC
LIMIT 8;
```

## 📝 Scripts Criados

1. **`scripts/check-auction-stages.ts`** - Verifica etapas existentes
2. **`scripts/seed-closing-with-stages.ts`** - Cria lotes com etapas

## 🚀 Como Testar

1. **Criar dados de teste:**
```bash
npx tsx scripts/seed-closing-with-stages.ts
```

2. **Verificar etapas:**
```bash
npx tsx scripts/check-auction-stages.ts
```

3. **Reiniciar o servidor:**
```bash
# Parar com Ctrl+C
npm run dev
```

4. **Acessar:** http://localhost:9003

## ✅ Resultado

A seção "⚡ Lotes Encerrando em Breve" agora:
- ✅ Busca lotes baseado na última etapa do leilão
- ✅ Mostra countdown da data de encerramento da etapa
- ✅ Filtra corretamente lotes nos próximos 7 dias
- ✅ Respeita a estrutura de dados correta (Lot → Auction → AuctionStage)

## 🎯 Estrutura Correta

```typescript
interface LotWithStage {
  id: string;
  title: string;
  status: 'ABERTO_PARA_LANCES';
  endDate: Date; // Data da última etapa do leilão
  auction: {
    id: string;
    title: string;
    stages: [{
      name: '2ª Praça';
      endDate: Date; // Data que será exibida no countdown
    }]
  }
}
```

**Agora a seção está corretamente integrada com AuctionStages! 🎉**
