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

async function HomePageData() {
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

    return (
        <HomePageClient
            platformSettings={settings}
            allAuctions={auctionsData}
            allLots={lotsData}
            categories={categoriesData}
            sellers={sellersData}
        />
    );
}

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

export default function HomePage() {
    return (
        <Suspense fallback={<HomePageSkeleton />}>
            <HomePageData />
        </Suspense>
    );
}
