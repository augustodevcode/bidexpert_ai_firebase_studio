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
            <Skeleton className="skeleton-hero-banner" data-ai-id="homepage-skeleton-hero" />
            <div className="section-skeleton-category" data-ai-id="homepage-skeleton-section-1">
                <Skeleton className="skeleton-section-title" data-ai-id="homepage-skeleton-title-1" />
                <div className="grid-skeleton-items" data-ai-id="homepage-skeleton-grid-1">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="card-skeleton-item" data-ai-id={`homepage-skeleton-card-1-${i}`} />)}
                </div>
            </div>
            <div className="section-skeleton-category" data-ai-id="homepage-skeleton-section-2">
                <Skeleton className="skeleton-section-title" data-ai-id="homepage-skeleton-title-2" />
                <div className="grid-skeleton-items" data-ai-id="homepage-skeleton-grid-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="card-skeleton-item" data-ai-id={`homepage-skeleton-card-2-${i}`} />)}
                </div>
            </div>
        </div>
    );
}

type HomeSearchParams = {
    homeVariant?: string;
};

export default async function HomePage({ searchParams }: { searchParams?: HomeSearchParams }) {
    const [
        settingsResult,
        auctionsResult,
        lotsResult,
        categoriesResult,
        sellersResult,
    ] = await Promise.allSettled([
        getPlatformSettings(),
        getAuctions(true, 10),
        getLots(undefined, true, 12),
        getLotCategories(),
        getSellers(true),
    ]);

    const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
    const auctionsData = auctionsResult.status === 'fulfilled' ? auctionsResult.value : [];
    const lotsData = lotsResult.status === 'fulfilled' ? lotsResult.value : [];
    const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
    const sellersData = sellersResult.status === 'fulfilled' ? sellersResult.value : [];

    if (settingsResult.status === 'rejected') {
        console.error('[HomePage] getPlatformSettings failed', settingsResult.reason);
    }
    if (auctionsResult.status === 'rejected') {
        console.error('[HomePage] getAuctions failed', auctionsResult.reason);
    }
    if (lotsResult.status === 'rejected') {
        console.error('[HomePage] getLots failed', lotsResult.reason);
    }
    if (categoriesResult.status === 'rejected') {
        console.error('[HomePage] getLotCategories failed', categoriesResult.reason);
    }
    if (sellersResult.status === 'rejected') {
        console.error('[HomePage] getSellers failed', sellersResult.reason);
    }

    const maxDaysUntilClosing = settings?.marketingSiteAdsSuperOpportunitiesDaysBeforeClosing ?? 7;
    let closingSoonLots: Lot[] = [];
    try {
        closingSoonLots = await getSuperOpportunitiesLots({
            maxDaysUntilClosing,
            limit: 8,
        });
    } catch (error) {
        console.error('[HomePage] getSuperOpportunitiesLots failed', error);
    }
    

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
