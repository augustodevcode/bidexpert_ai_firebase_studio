# Correção do Erro: lotService.getLotDetailsForV2 is not a function

## Problema Identificado

Ao tentar abrir a página de detalhes do lote a partir do modal de quick preview, ocorria o seguinte erro:

```
lotService.getLotDetailsForV2 is not a function
```

URL afetada: `http://localhost:9005/auctions/auction-1763656354435-4/lots/lot-1763656354435-8`

## Causa Raiz

1. **Método faltante no LotService**: O arquivo `src/app/auctions/[auctionId]/lots/[lotId]/actions.ts` estava chamando `lotService.getLotDetailsForV2()`, mas este método não existia em `src/services/lot.service.ts`.

2. **Outros métodos faltantes**: Além do `getLotDetailsForV2`, vários outros métodos referenciados no arquivo actions.ts também não existiam:
   - `placeMaxBid`
   - `getActiveUserMaxBid`
   - `getReviews`
   - `createReview`
   - `getQuestions`
   - `createQuestion`
   - `answerQuestion`

3. **Tipos faltantes**: Os tipos `Lot`, `Review` e `BidInfo` não estavam propriamente exportados em `src/types/index.ts`. O tipo Auction tinha propriedades do Lot misturadas incorretamente.

## Solução Implementada

### 1. Correção dos Tipos (`src/types/index.ts`)

Separamos corretamente os tipos Auction e Lot, que estavam misturados:

```typescript
export type Auction = Omit<PmAuction, ...> & {
  // Propriedades apenas do Auction
  lots?: Lot[];
  totalLots?: number;
  seller?: SellerProfileInfo;
  // ...
};

export type Lot = Omit<PmLot, ...> & {
  // Propriedades específicas do Lot
  id: string;
  auctionId: string;
  auction?: Auction;
  assets?: Asset[];
  // ...
};

export type Review = Omit<PmReview, ...> & { 
  id: string; 
  lotId: string; 
  auctionId: string; 
  userId: string; 
};

export type BidInfo = Omit<PmBid, ...> & { 
  id: string; 
  lotId: string; 
  auctionId: string; 
  bidderId: string; 
  tenantId: string; 
  amount: number; 
};
```

### 2. Atualização do LotService (`src/services/lot.service.ts`)

#### Imports adicionados:

```typescript
import type { Lot, LotFormData, LotQuestion, Review, SellerProfileInfo, AuctioneerProfileInfo, BidInfo, UserLotMaxBid } from '@/types';
import { LotQuestionService } from '@/services/lot-question.service';
import { ReviewService } from '@/services/review.service';
import { SellerService } from '@/services/seller.service';
import { AuctioneerService } from '@/services/auctioneer.service';
```

#### Serviços auxiliares adicionados no constructor:

```typescript
constructor() {
  this.prisma = prisma;
  this.repository = {};
  this.auctionRepository = {};
  this.lotQuestionService = new LotQuestionService();
  this.reviewService = new ReviewService();
  this.sellerService = new SellerService();
  this.auctioneerService = new AuctioneerService();
}
```

#### Métodos implementados:

1. **placeMaxBid**: Configura o lance máximo para um lote
2. **getActiveUserMaxBid**: Busca o lance máximo ativo de um usuário
3. **getReviews**: Busca todas as avaliações de um lote
4. **createReview**: Cria uma nova avaliação
5. **getQuestions**: Busca todas as perguntas de um lote
6. **createQuestion**: Cria uma nova pergunta
7. **answerQuestion**: Adiciona resposta a uma pergunta
8. **getLotDetailsForV2**: Método principal que agrega todos os dados do lote

#### Implementação do getLotDetailsForV2:

```typescript
async getLotDetailsForV2(lotIdOrPublicId: string): Promise<{
  lot: Lot;
  auction: any;
  seller: SellerProfileInfo | null;
  auctioneer: AuctioneerProfileInfo | null;
  bids: BidInfo[];
  questions: LotQuestion[];
  reviews: Review[];
} | null> {
  try {
    const lot = await this.getLotById(lotIdOrPublicId, undefined, true);
    if (!lot) return null;

    const [bids, questions, reviews] = await Promise.all([
      this.getBidHistory(lotIdOrPublicId),
      this.getQuestions(lotIdOrPublicId),
      this.getReviews(lotIdOrPublicId)
    ]);

    let seller: SellerProfileInfo | null = null;
    if (lot.auction?.sellerId) {
      seller = await this.sellerService.getSellerById('1', lot.auction.sellerId);
    }

    let auctioneer: AuctioneerProfileInfo | null = null;
    if (lot.auction?.auctioneerId) {
      auctioneer = await this.auctioneerService.getAuctioneerById('1', lot.auction.auctioneerId);
    }

    return {
      lot,
      auction: lot.auction,
      seller,
      auctioneer,
      bids,
      questions,
      reviews
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do lote:', error);
    return null;
  }
}
```

## Filosofia da Plataforma Respeitada

A solução seguiu os princípios arquiteturais da plataforma:

1. **Separação de responsabilidades**: Cada serviço (LotQuestionService, ReviewService, etc.) mantém sua responsabilidade específica
2. **Reutilização de código**: Os métodos do LotService delegam para os serviços especializados existentes
3. **Consistência de tipos**: Todos os IDs são strings no frontend, conversão de BigInt acontece na camada de serviço
4. **Agregação de dados**: O método V2 agrega dados de múltiplas fontes de forma eficiente usando Promise.all
5. **Tratamento de erros**: Todos os métodos têm try/catch apropriados e retornam valores padrão em caso de erro

## Arquivos Modificados

1. `src/types/index.ts` - Corrigido tipos Auction e Lot, adicionados tipos Review e BidInfo
2. `src/services/lot.service.ts` - Adicionados 8 novos métodos e dependências de serviços

## Resultado

A página de detalhes do lote agora funciona corretamente ao ser acessada a partir do modal de quick preview. Todos os dados necessários (lote, leilão, vendedor, leiloeiro, lances, perguntas e avaliações) são carregados de forma agregada e eficiente.
