// src/app/home-page-client.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import HeroSection from '@/components/hero-section';
import ClosingSoonCarousel from '@/components/closing-soon-carousel';
import TopCategories from '@/components/top-categories';
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
    sellers,
    closingSoonLots = []
}: {
    platformSettings: PlatformSettings | null;
    allAuctions: Auction[];
    allLots: Lot[];
    categories: LotCategory[];
    sellers: SellerProfileInfo[];
    closingSoonLots?: Lot[];
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

  const featuredAuctions = allAuctions.filter(a => a.isFeaturedOnMarketplace && activeAuctionStatuses.includes(a.status as any)).sort((a, b) => {
    const dateA = b.auctionDate ? new Date(b.auctionDate).getTime() : 0;
    const dateB = a.auctionDate ? new Date(a.auctionDate).getTime() : 0;
    return dateA - dateB;
  }).slice(0, 4);
  const recentActiveAuctions = allAuctions.filter(a => activeAuctionStatuses.includes(a.status as any)).slice(0, 4);
  const auctionsToDisplay = featuredAuctions.length > 0 ? featuredAuctions : recentActiveAuctions;
  const auctionsTitle = featuredAuctions.length > 0 ? "Leilões em Destaque" : "Leilões Recentes";
  
  const featuredCategories = categories.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0)).slice(0, 3);
  const featuredSellers = sellers.filter(s => s.logoUrl).slice(0, 12);

  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-20">
      <HeroSection />
      
      {closingSoonLots.length > 0 && <ClosingSoonCarousel lots={closingSoonLots} auctions={allAuctions} platformSettings={platformSettings} />}
      
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold font-headline">{lotsTitle}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href="/search?type=lots">
                    Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      <TopCategories categories={categories.slice(0, 8)} />

      <div className="grid md:grid-cols-2 gap-6">
        <PromoCard 
            title="Venda seus Ativos Conosco"
            description="Transforme seus bens em liquidez de forma rápida e segura. Nossa plataforma conecta você a milhares de compradores qualificados."
            imageUrl="https://picsum.photos/seed/sell/400/300"
            imageAlt="Pessoa assinando contrato para vender em leilão"
            dataAiHint="contrato acordo"
            link="/sell-with-us"
        />
         <PromoCard 
            title="Leilões Judiciais"
            description="Acesse oportunidades únicas de processos judiciais com a transparência e segurança que só o BidExpert oferece."
            imageUrl="https://picsum.photos/seed/judicial/400/300"
            imageAlt="Martelo da justiça em frente a um tribunal"
            dataAiHint="justica tribunal"
            link="/search?type=auctions&auctionType=JUDICIAL"
            bgColorClass="bg-primary/5 dark:bg-primary/10"
        />
      </div>

       <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold font-headline">{auctionsTitle}</h2>
          <Button variant="outline" size="sm" asChild>
              <Link href="/search?type=auctions">
              Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        <h2 className="text-2xl md:text-3xl font-bold font-headline text-center">Navegue por Categorias</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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