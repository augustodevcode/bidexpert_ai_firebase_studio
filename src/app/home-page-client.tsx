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
      <div className="container-error-message">
        <p className="text-error-message">Erro ao carregar as configurações da plataforma.</p>
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
    <div className="container-homepage">
      <HeroCarousel />
      
      <section className="section-spaced">
        <div className="section-header-actions">
          <h2 className="section-title">{lotsTitle}</h2>
          <div className="container-action-buttons">
            <Button variant="outline" size="sm" asChild className="btn-view-ended">
                <Link href="/search?type=lots&status=ENCERRADO,VENDIDO,NAO_VENDIDO">
                    <CalendarX className="icon-action" /> Ver Encerrados
                </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="btn-view-cancelled">
                <Link href="/search?type=lots&status=CANCELADO">
                    <XCircle className="icon-action" /> Ver Cancelados
                </Link>
            </Button>
            <Button variant="default" asChild className="btn-view-all">
                <Link href="/search?type=lots">
                    Ver Todos <ArrowRight className="icon-arrow-right" />
                </Link>
            </Button>
          </div>
        </div>
        <div className="grid-lots">
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

      <div className="grid-promo-cards">
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

       <section className="section-spaced">
        <div className="section-header-actions">
          <h2 className="section-title">{auctionsTitle}</h2>
          <div className="container-action-buttons">
              <Button variant="outline" size="sm" asChild className="btn-view-ended">
                <Link href="/search?type=auctions&status=ENCERRADO,FINALIZADO">
                    <CalendarX className="icon-action" /> Ver Encerrados
                </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="btn-view-cancelled">
                <Link href="/search?type=auctions&status=CANCELADO">
                    <XCircle className="icon-action" /> Ver Cancelados
                </Link>
            </Button>
            <Button variant="default" asChild className="btn-view-all">
                <Link href="/search?type=auctions">
                Ver Todos <ArrowRight className="icon-arrow-right" />
                </Link>
            </Button>
          </div>
        </div>
        <div className="grid-auctions">
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
      
      <section className="section-spaced">
        <h2 className="section-title text-center">Navegue por Categorias</h2>
        <div className="grid-categories">
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
