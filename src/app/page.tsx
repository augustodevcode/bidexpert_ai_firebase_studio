// src/app/page.tsx

import { Suspense } from 'react';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Lot } from '@/types';
import { getLotCategories } from './admin/categories/actions';
import { getSellers } from './admin/sellers/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import HomePageClient from './home-page-client';
import { Skeleton } from '@/components/ui/skeleton';
import { prisma } from '@/lib/prisma';
import { isPast } from 'date-fns';

export const dynamic = 'force-dynamic';

function HomePageSkeleton() {
    return (
        <div className="container-homepage-skeleton" data-ai-id="homepage-skeleton">
            <Skeleton className="skeleton-hero-banner" />
            <div className="section-skeleton-category">
                <Skeleton className="skeleton-section-title" />
                <div className="grid-skeleton-items">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="card-skeleton-item" />)}
                </div>
            </div>
            <div className="section-skeleton-category">
                <Skeleton className="skeleton-section-title" />
                <div className="grid-skeleton-items">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="card-skeleton-item" />)}
                </div>
            </div>
        </div>
    );
}

type HomeSearchParams = {
    homeVariant?: string;
};

const toOptionalString = (value: unknown): string | null => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
    return null;
};

export default async function HomePage({ searchParams }: { searchParams?: HomeSearchParams }) {
  // Otimização: Buscar apenas um subconjunto de dados para a página inicial
  const [
      settings,
      auctionsData,
      lotsData,
      categoriesData,
      sellersData,
  ] = await Promise.all([
      getPlatformSettings(),
      getAuctions(true, 10), // Limitar para 10 leilões
    getLots(undefined, true, 12), // Public call
      getLotCategories(),
      getSellers(true),
  ]);

  // Buscar lotes encerrando em breve baseado na última etapa do leilão
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const closingSoonLotsWithStages = await prisma.lot.findMany({
      where: {
          status: 'ABERTO_PARA_LANCES',
      },
      include: {
          auction: {
              include: {
                  stages: {
                      orderBy: { endDate: 'desc' },
                  }
              }
          }
      },
      take: 50,
  });

  // Mapear para adicionar a data da última etapa ao lote, filtrar e converter tipos
    const closingSoonLots = closingSoonLotsWithStages
        .map(lot => {
      // **FIX**: If lot.auction is null, we can't process this lot. Skip it.
      if (!lot.auction) {
        return null;
      }
            const lotRecord = lot as Record<string, unknown>;
      
      const lastStage = lot.auction?.stages?.[0];
      const relevantEndDate = lastStage?.endDate || lot.endDate;

      if (!relevantEndDate || isPast(new Date(relevantEndDate)) || new Date(relevantEndDate) > sevenDaysFromNow) {
          return null; // Ignorar lotes que não se encaixam no critério
      }
      
      // Converter todos os IDs de bigint para string e mapear para o tipo Lot
      return {
          ...lot,
          id: lot.id.toString(),
          auctionId: lot.auctionId.toString(),
          categoryId: lot.categoryId?.toString() || null,
          subcategoryId: lot.subcategoryId?.toString() || null,
          sellerId: lot.sellerId?.toString() || null,
          auctioneerId: lot.auctioneerId?.toString() || null,
          cityId: lot.cityId?.toString() || null,
          stateId: lot.stateId?.toString() || null,
          winnerId: lot.winnerId?.toString() || null,
          tenantId: lot.tenantId.toString(), // Convert tenantId to string
          originalLotId: 'original_lot_id' in lot ? toOptionalString(lotRecord['original_lot_id']) : null,
          inheritedMediaFromAssetId: 'inheritedMediaFromAssetId' in lot ? toOptionalString(lotRecord['inheritedMediaFromAssetId']) : null,
          price: Number(lot.price),
          initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
          secondInitialPrice: 'secondInitialPrice' in lot && lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
          bidIncrementStep: 'bidIncrementStep' in lot && lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
          evaluationValue: 'evaluationValue' in lot && lot.evaluationValue ? Number(lot.evaluationValue) : null,
          latitude: 'latitude' in lot ? (lot.latitude !== null ? Number(lot.latitude) : null) : null,
          longitude: 'longitude' in lot ? (lot.longitude !== null ? Number(lot.longitude) : null) : null,
          stageDetails: [], // Initialize as empty array to match LotStageDetails[] type
          endDate: relevantEndDate,
          auction: {
              ...lot.auction,
              id: lot.auction.id.toString(),
              tenantId: lot.auction.tenantId.toString(),
              auctioneerId: lot.auction.auctioneerId?.toString() || null,
              sellerId: lot.auction.sellerId?.toString() || null,
              cityId: lot.auction.cityId?.toString() || null,
              stateId: lot.auction.stateId?.toString() || null,
              judicialProcessId: lot.auction.judicialProcessId?.toString() || null,
              categoryId: 'categoryId' in lot.auction && lot.auction.categoryId ? lot.auction.categoryId.toString() : null,
              originalAuctionId: lot.auction.originalAuctionId?.toString() || null,
              latitude: lot.auction.latitude !== null ? Number(lot.auction.latitude) : null,
              longitude: lot.auction.longitude !== null ? Number(lot.auction.longitude) : null,
              initialOffer: 'initialOffer' in lot.auction && lot.auction.initialOffer !== null ? Number(lot.auction.initialOffer) : undefined,
              estimatedRevenue: 'estimatedRevenue' in lot.auction && lot.auction.estimatedRevenue !== null ? Number(lot.auction.estimatedRevenue) : undefined,
              achievedRevenue: 'achievedRevenue' in lot.auction && lot.auction.achievedRevenue !== null ? Number(lot.auction.achievedRevenue) : undefined,
              decrementAmount: 'decrementAmount' in lot.auction ? (lot.auction.decrementAmount !== null ? Number(lot.auction.decrementAmount) : null) : null,
              floorPrice: 'floorPrice' in lot.auction ? (lot.auction.floorPrice !== null ? Number(lot.auction.floorPrice) : null) : null,
              additionalTriggers: ('additionalTriggers' in lot.auction && Array.isArray(lot.auction.additionalTriggers) 
                  ? lot.auction.additionalTriggers.filter((t): t is string => typeof t === 'string')
                  : []) as string[],
              autoRelistSettings: 'autoRelistSettings' in lot.auction ? lot.auction.autoRelistSettings : undefined,
              stages: (lot.auction.stages || []).map(stage => ({
                  id: stage.id.toString(),
                  auctionId: stage.auctionId.toString(),
                  name: stage.name,
                  startDate: stage.startDate,
                  endDate: stage.endDate,
                  initialPrice: stage.initialPrice ? Number(stage.initialPrice) : null,
                  discountPercent: stage.discountPercent ? Number(stage.discountPercent) : 100,
                  status: 'ATIVO' as const, // Default status
                  order: 0, // Default order
                  createdAt: new Date(), // Default to current date
                  updatedAt: new Date(), // Default to current date
                  tenantId: lot.tenantId.toString()
              }))
          }
      };
    })
    .filter((lot): lot is Lot => lot !== null) // Remove os nulos (lotes que não passaram no filtro)
    .slice(0, 8); // Pega os 8 primeiros após o filtro
    

    const variantParam = (searchParams?.homeVariant || '').toLowerCase();
    const variant = variantParam === 'beta' ? 'beta' : 'classic';

    return (
    <Suspense fallback={<HomePageSkeleton />}>
        <HomePageClient
            platformSettings={settings}
            allAuctions={auctionsData}
            allLots={lotsData}
            categories={categoriesData}
            sellers={sellersData}
                        closingSoonLots={closingSoonLots}
                        variant={variant}
        />
    </Suspense>
  );
}
