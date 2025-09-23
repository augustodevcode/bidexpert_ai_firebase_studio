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

    // ATENÇÃO: Conversão de `Decimal` para `Number`
    // Os dados que vêm do Prisma (através das server actions) podem conter campos
    // do tipo `Decimal`. Este tipo não é serializável e não pode ser passado
    // diretamente de um Server Component para um Client Component.
    // Portanto, precisamos converter manualmente esses campos para `Number` ou `String`.

    const serializedLots = lotsData.map(lot => ({
      ...lot,
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      price: lot.price ? Number(lot.price) : null,
      evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
    }));

    const serializedAuctions = auctionsData.map(auction => ({
        ...auction,
        initialOffer: auction.initialOffer ? Number(auction.initialOffer) : null,
        estimatedRevenue: auction.estimatedRevenue ? Number(auction.estimatedRevenue) : null,
        achievedRevenue: auction.achievedRevenue ? Number(auction.achievedRevenue) : null,
        decrementAmount: auction.decrementAmount ? Number(auction.decrementAmount) : null,
        floorPrice: auction.floorPrice ? Number(auction.floorPrice) : null,
    }));


    return (
        <HomePageClient
            platformSettings={settings}
            allAuctions={serializedAuctions}
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
