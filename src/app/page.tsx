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
import { getSuperOpportunitiesLots } from '@/services/super-opportunities.service';

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

  // Buscar lotes para Super Oportunidades com validação completa de integridade referencial
  const maxDaysUntilClosing = settings?.marketingSiteAdsSuperOpportunitiesDaysBeforeClosing ?? 7;
  const closingSoonLots = await getSuperOpportunitiesLots({
    maxDaysUntilClosing,
    limit: 8,
  });
    

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
