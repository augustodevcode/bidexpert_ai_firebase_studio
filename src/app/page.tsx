// src/app/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
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

    const serializedLots = lotsData.map(lot => ({
      ...lot,
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      price: lot.price ? Number(lot.price) : null,
      // Certifique-se de que todos os campos Decimal sejam convertidos
    }));

    return (
        <HomePageClient
            platformSettings={settings}
            allAuctions={auctionsData}
            allLots={serializedLots}
            categories={categoriesData}
            sellers={sellersData}
        />
    );
}

function HomePageSkeleton() {
    return (
        <div className="space-y-12">
            <Skeleton className="h-[400px] w-full rounded-lg" />
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
            </div>
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
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
