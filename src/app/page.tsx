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
        <div className="space-y-16 animate-pulse" data-ai-id="homepage-skeleton">
            <Skeleton className="h-[450px] w-full rounded-lg bg-muted" />
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full bg-muted" />)}
                </div>
            </div>
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full bg-muted" />)}
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
