// src/app/page.tsx
import { Suspense } from 'react';
import HeroCarousel from '@/components/hero-carousel';
import FilterLinkCard from '@/components/filter-link-card';
import PromoCard from '@/components/promo-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getLotCategories as getCategories } from '@/app/admin/categories/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import FeaturedItems from '@/components/featured-items';
import type { Auction, Lot } from '@/types';

async function HomePageContent() {
  const [platformSettings, allAuctions, allLots, categories] = await Promise.all([
    getPlatformSettings(),
    getAuctions(),
    getLots(),
    getCategories(),
  ]);

  if (!platformSettings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p>Carregando configurações da plataforma...</p>
        </div>
      </div>
    );
  }

  const featuredLots = allLots
    .filter(l => l.isFeatured)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8);
  const lotsToDisplay = featuredLots.length > 0 ? featuredLots : allLots.slice(0, 8);
  const lotsTitle = featuredLots.length > 0 ? "Lotes em Destaque" : "Lotes Recentes";

  const featuredAuctions = allAuctions
    .filter(a => a.isFeaturedOnMarketplace)
    .sort((a, b) => new Date(b.auctionDate as string).getTime() - new Date(a.auctionDate as string).getTime())
    .slice(0, 4);
  const auctionsToDisplay = featuredAuctions.length > 0 ? featuredAuctions : allAuctions.slice(0, 4);
  const auctionsTitle = featuredAuctions.length > 0 ? "Leilões em Destaque" : "Leilões Recentes";
  
  const featuredCategories = categories.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0)).slice(0, 3);
  const categoryAssets = [
    { imageUrl: 'https://placehold.co/400x400.png?text=Imoveis', imageAlt: 'Imóveis em Leilão', dataAiHint: 'casa apartamento' },
    { imageUrl: 'https://placehold.co/400x400.png?text=Veiculos', imageAlt: 'Veículos em Leilão', dataAiHint: 'carro moto' },
    { imageUrl: 'https://placehold.co/400x400.png?text=Maquinario', imageAlt: 'Maquinário em Leilão', dataAiHint: 'trator maquina' },
  ];

  return (
    <div className="space-y-16">
      <HeroCarousel />
      
      <FeaturedItems items={lotsToDisplay} type="lot" title={lotsTitle} viewAllLink="/search?type=lots" platformSettings={platformSettings} allAuctions={allAuctions} />

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

       <FeaturedItems items={auctionsToDisplay} type="auction" title={auctionsTitle} viewAllLink="/search?type=auctions" platformSettings={platformSettings} />

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Navegue por Categorias</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCategories.map((category, index) => (
                 <FilterLinkCard 
                    key={category.id}
                    title={category.name}
                    subtitle={`${category.itemCount || 0}+ Oportunidades`}
                    imageUrl={category.logoUrl || categoryAssets[index]?.imageUrl || ''}
                    imageAlt={category.description || `Ícone para ${category.name}`}
                    dataAiHint={category.dataAiHintIcon || 'categoria leilao'}
                    link={`/category/${category.slug}`}
                />
            ))}
        </div>
      </section>
    </div>
  );
}


export default function HomePage() {
   const genericLoadingComponent = (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <Suspense fallback={genericLoadingComponent}>
      <HomePageContent />
    </Suspense>
  )
}