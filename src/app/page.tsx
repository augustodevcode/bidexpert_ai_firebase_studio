// src/app/page.tsx
import { Suspense } from 'react';
import HeroCarousel from '@/components/hero-carousel';
import FilterLinkCard from '@/components/filter-link-card';
import PromoCard from '@/components/promo-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getLotCategories as getCategories } from '@/app/admin/categories/actions';

// Components
import FeaturedItems from '@/components/featured-items';

async function FeaturedAuctions() {
  const auctions = await getAuctions();
  const featured = auctions
    .filter(a => a.isFeaturedOnMarketplace)
    .sort((a, b) => new Date(b.auctionDate as string).getTime() - new Date(a.auctionDate as string).getTime())
    .slice(0, 4);
    
  if (featured.length === 0) {
      // Fallback to most recent if none are featured
      return <FeaturedItems items={auctions.slice(0, 4)} type="auction" title="Leilões Recentes" viewAllLink="/search?type=auctions" />;
  }
  
  return <FeaturedItems items={featured} type="auction" title="Leilões em Destaque" viewAllLink="/search?type=auctions" />;
}

async function FeaturedLots() {
  const lots = await getLots();
  const featured = lots
    .filter(l => l.isFeatured)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8);
    
  if (featured.length === 0) {
     return <FeaturedItems items={lots.slice(0, 8)} type="lot" title="Lotes Recentes" viewAllLink="/search?type=lots" />;
  }
  
  return <FeaturedItems items={featured} type="lot" title="Lotes em Destaque" viewAllLink="/search?type=lots" />;
}

async function FeaturedCategories() {
    const categories = await getCategories();
    // Example logic: feature categories with the most items, or a manually curated list
    const featured = categories.sort((a,b) => (b.itemCount || 0) - (a.itemCount || 0) ).slice(0, 3);
    
    const categoryAssets = [
        { imageUrl: 'https://placehold.co/400x400.png?text=Imoveis', imageAlt: 'Imóveis em Leilão', dataAiHint: 'casa apartamento' },
        { imageUrl: 'https://placehold.co/400x400.png?text=Veiculos', imageAlt: 'Veículos em Leilão', dataAiHint: 'carro moto' },
        { imageUrl: 'https://placehold.co/400x400.png?text=Maquinario', imageAlt: 'Maquinário em Leilão', dataAiHint: 'trator maquina' },
    ];

    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center">Navegue por Categorias</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featured.map((category, index) => (
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
    );
}

export default function HomePage() {
  const genericLoadingComponent = (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-16">
      <HeroCarousel />
      
      <Suspense fallback={genericLoadingComponent}>
        <FeaturedLots />
      </Suspense>

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

       <Suspense fallback={genericLoadingComponent}>
            <FeaturedAuctions />
        </Suspense>

      <Suspense fallback={genericLoadingComponent}>
        <FeaturedCategories />
      </Suspense>
    </div>
  );
}
