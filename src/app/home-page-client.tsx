// src/app/home-page-client.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import HeroCarousel from '@/components/hero-carousel';
import FilterLinkCard from '@/components/filter-link-card';
import PromoCard from '@/components/promo-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, List, CalendarX, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { Auction, Lot, LotCategory, SellerProfileInfo, PlatformSettings } from '@/types';
import { getCategoryAssets, slugify } from '@/lib/ui-helpers';
import FeaturedSellers from '@/components/featured-sellers';
import UniversalCard from '@/components/universal-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePageClient({ 
    platformSettings,
    allAuctions,
    allLots,
    categories,
    sellers
}: {
    platformSettings: PlatformSettings | null;
    allAuctions: Auction[];
    allLots: Lot[];
    categories: LotCategory[];
    sellers: SellerProfileInfo[];
}) {

  if (!platformSettings) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">Erro ao carregar as configurações da plataforma.</p>
      </div>
    );
  }

  const activeLotStatuses = ['ABERTO_PARA_LANCES', 'EM_BREVE'];
  const activeAuctionStatuses = ['ABERTO_PARA_LANCES', 'EM_BREVE', 'ABERTO'];

  const featuredLots = allLots.filter(l => l.isFeatured && activeLotStatuses.includes(l.status)).sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8);
  const recentActiveLots = allLots.filter(l => activeLotStatuses.includes(l.status)).slice(0,8);
  const lotsToDisplay = featuredLots.length > 0 ? featuredLots : recentActiveLots;
  const lotsTitle = featuredLots.length > 0 ? "Lotes em Destaque" : "Lotes Recentes";

  const featuredAuctions = allAuctions.filter(a => a.isFeaturedOnMarketplace && activeAuctionStatuses.includes(a.status as any)).sort((a, b) => new Date(b.auctionDate as string).getTime() - new Date(a.auctionDate as string).getTime()).slice(0, 4);
  const recentActiveAuctions = allAuctions.filter(a => activeAuctionStatuses.includes(a.status as any)).slice(0, 4);
  const auctionsToDisplay = featuredAuctions.length > 0 ? featuredAuctions : recentActiveAuctions;
  const auctionsTitle = featuredAuctions.length > 0 ? "Leilões em Destaque" : "Leilões Recentes";
  
  const featuredCategories = categories.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0)).slice(0, 3);
  const featuredSellers = sellers.filter(s => s.logoUrl).slice(0, 12);

  return (
    <div className="space-y-16">
      <HeroCarousel />
      
      <section className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-3xl font-bold">{lotsTitle}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
                <Link href="/search?type=lots&status=ENCERRADO,VENDIDO,NAO_VENDIDO">
                    <CalendarX className="mr-2 h-4 w-4" /> Ver Encerrados
                </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
                <Link href="/search?type=lots&status=CANCELADO">
                    <XCircle className="mr-2 h-4 w-4" /> Ver Cancelados
                </Link>
            </Button>
            <Button variant="default" asChild>
                <Link href="/search?type=lots">
                    Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {lotsToDisplay.map((item) => (
              <UniversalCard
                key={item.id}
                item={item}
                type="lot"
                platformSettings={platformSettings}
                parentAuction={allAuctions.find(a => a.id === item.auctionId)}
              />
            ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <PromoCard 
            title="Venda seus Ativos Conosco"
            description="Transforme seus bens em liquidez de forma rápida e segura. Nossa plataforma conecta você a milhares de compradores qualificados."
            imageUrl="https://placehold.co/400x300.png?text=Venda+Conosco"
            imageAlt="Pessoa assinando contrato para vender em leilão"
            dataAiHint="contrato acordo"
            link="/sell-with-us"
        />
         <PromoCard 
            title="Leilões Judiciais"
            description="Acesse oportunidades únicas de processos judiciais com a transparência e segurança que só o BidExpert oferece."
            imageUrl="https://placehold.co/400x300.png?text=Leiloes+Judiciais"
            imageAlt="Martelo da justiça em frente a um tribunal"
            dataAiHint="justica tribunal"
            link="/search?type=auctions&auctionType=JUDICIAL"
            bgColorClass="bg-primary/5 dark:bg-primary/10"
        />
      </div>

       <section className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-3xl font-bold">{auctionsTitle}</h2>
          <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <Link href="/search?type=auctions&status=ENCERRADO,FINALIZADO">
                    <CalendarX className="mr-2 h-4 w-4" /> Ver Encerrados
                </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
                <Link href="/search?type=auctions&status=CANCELADO">
                    <XCircle className="mr-2 h-4 w-4" /> Ver Cancelados
                </Link>
            </Button>
            <Button variant="default" asChild>
                <Link href="/search?type=auctions">
                Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctionsToDisplay.map((item) => (
              <UniversalCard
                key={item.id}
                item={item}
                type="auction"
                platformSettings={platformSettings}
              />
            ))}
        </div>
      </section>
      
      <FeaturedSellers sellers={featuredSellers} />
      
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Navegue por Categorias</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCategories.map((category) => {
                 const assets = getCategoryAssets(category.name);
                 return (
                     <FilterLinkCard 
                        key={category.id}
                        title={category.name}
                        subtitle={`${category.itemCount || 0}+ Oportunidades`}
                        imageUrl={category.coverImageUrl || assets.bannerUrl || ''}
                        imageAlt={category.description || `Ícone para ${category.name}`}
                        dataAiHint={category.dataAiHintCover || assets.bannerAiHint}
                        link={`/category/${category.slug}`}
                    />
                 )
            })}
        </div>
      </section>
    </div>
  );
}
