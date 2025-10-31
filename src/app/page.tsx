// src/app/page.tsx
import { Suspense } from 'react';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, Lot, LotCategory, SellerProfileInfo, PlatformSettings } from '@/types';
import { getLotCategories } from './admin/categories/actions';
import { getSellers } from './admin/sellers/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import HomePageClient from './home-page-client';
import { Skeleton } from '@/components/ui/skeleton';
import { PrismaClient } from '@prisma/client';
import { isPast } from 'date-fns';

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

export default async function HomePage() {
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
      getLots(undefined, true, 12), // Limitar para 12 lotes
      getLotCategories(),
      getSellers(true),
  ]);

  // Buscar lotes encerrando em breve baseado na última etapa do leilão
  const prisma = new PrismaClient();
  
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
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
                      take: 1,
                  }
              }
          }
      },
      take: 8,
  });

  // Mapear para adicionar a data da última etapa ao lote
  const closingSoonLots = closingSoonLotsWithStages.map(lot => {
    const relevantEndDate = lot.auction?.stages?.[0]?.endDate || lot.endDate;
    return {
        ...lot,
        endDate: relevantEndDate, // Use a data da etapa se disponível
    };
  }).filter(lot => lot.endDate && !isPast(new Date(lot.endDate as string))) as unknown as Lot[];

  await prisma.$disconnect();

  return (
    <Suspense fallback={<HomePageSkeleton />}>
        <HomePageClient
            platformSettings={settings}
            allAuctions={auctionsData}
            allLots={lotsData}
            categories={categoriesData}
            sellers={sellersData}
            closingSoonLots={closingSoonLots}
        />
    </Suspense>
  );
}
