/**
 * @fileoverview The main home page of the BidExpert application.
 * This server component fetches initial data for display, such as featured lots and auctions,
 * and renders the main sections of the homepage including the hero carousel and filter links.
 */
import AuctionCard from '@/components/auction-card';
import HeroCarousel from '@/components/hero-carousel';
import FilterLinkCard from '@/components/filter-link-card';
import LotCard from '@/components/lot-card';
import type { Auction, Lot, PlatformSettings } from '@/types';
import Link from 'next/link';
import { Landmark, Scale, FileText as FileTextIcon, Tags, CalendarX, CheckSquare, Star, Gavel as TomadaPrecosIcon } from 'lucide-react';
import { fetchAuctions, fetchLots, fetchPlatformSettings } from '@/lib/data-queries';
import { getCategoryAssets } from '@/lib/sample-data-helpers';

console.log("[HomePage] LOG: page.tsx file is being processed by Next.js.");

/**
 * The main server component for the homepage.
 * It fetches all necessary data for rendering the initial view of the site.
 * It includes error handling to prevent crashes if data fetching fails.
 * @returns {Promise<JSX.Element>} The rendered homepage component.
 */
export default async function HomePage() {
  console.log("[HomePage] LOG: Rendering started.");
  try {
    console.log("[HomePage] LOG: Calling fetchPlatformSettings()...");
    const platformSettings = await fetchPlatformSettings();
    console.log("[HomePage] LOG: fetchPlatformSettings() finished.");

    // Fetch data using server actions
    console.log("[HomePage] LOG: Calling fetchAuctions()...");
    const allAuctions = await fetchAuctions();
    console.log("[HomePage] LOG: fetchAuctions() finished.");

    console.log("[HomePage] LOG: Calling fetchLots()...");
    const allLots = await fetchLots();
    console.log("[HomePage] LOG: fetchLots() finished.");

    console.log(`[HomePage] LOG: Data fetched. Auctions: ${allAuctions.length}, Lots: ${allLots.length}`);

    // Filter for featured auctions and lots
    const featuredAuctions = allAuctions
      .filter(a => a.isFeaturedOnMarketplace && a.status === 'ABERTO_PARA_LANCES')
      .slice(0, 10);

    const featuredLots = allLots
      .filter(lot => lot.isFeatured && lot.status === 'ABERTO_PARA_LANCES')
      .slice(0, 10);

    const filterLinksData = [
      {
        title: 'Leilões Judiciais',
        subtitle: 'Oportunidades de processos judiciais.',
        imageUrl: getCategoryAssets('Leilões Judiciais').bannerUrl,
        imageAlt: 'Ícone Leilões Judiciais',
        dataAiHint: getCategoryAssets('Leilões Judiciais').bannerAiHint,
        link: '/search?type=auctions&auctionType=JUDICIAL',
        bgColorClass: 'bg-sky-50 dark:bg-sky-900/40 hover:border-sky-300',
      },
      {
        title: 'Leilões Extrajudiciais',
        subtitle: 'Negociações diretas e mais ágeis.',
        imageUrl: getCategoryAssets('Leilões Extrajudiciais').bannerUrl,
        imageAlt: 'Ícone Leilões Extrajudiciais',
        dataAiHint: getCategoryAssets('Leilões Extrajudiciais').bannerAiHint,
        link: '/search?type=auctions&auctionType=EXTRAJUDICIAL',
        bgColorClass: 'bg-teal-50 dark:bg-teal-900/40 hover:border-teal-300',
      },
      {
        title: 'Tomada de Preços',
        subtitle: 'Processo de seleção e cotação.',
        imageUrl: getCategoryAssets('Tomada de Preços').bannerUrl,
        imageAlt: 'Ícone Tomada de Preços',
        dataAiHint: getCategoryAssets('Tomada de Preços').bannerAiHint,
        link: '/search?type=auctions&auctionType=TOMADA_DE_PRECOS',
        bgColorClass: 'bg-indigo-50 dark:bg-indigo-900/40 hover:border-indigo-300',
      },
      {
        title: 'Venda Direta',
        subtitle: 'Compre sem a disputa de lances.',
        imageUrl: getCategoryAssets('Venda Direta').bannerUrl,
        imageAlt: 'Ícone Venda Direta',
        dataAiHint: getCategoryAssets('Venda Direta').bannerAiHint,
        link: '/direct-sales',
        bgColorClass: 'bg-amber-50 dark:bg-amber-900/40 hover:border-amber-300',
      },
      {
        title: 'Leilões Encerrados',
        subtitle: 'Consulte o histórico de resultados.',
        imageUrl: getCategoryAssets('Leilões Encerrados').bannerUrl,
        imageAlt: 'Ícone Leilões Encerrados',
        dataAiHint: getCategoryAssets('Leilões Encerrados').bannerAiHint,
        link: '/search?type=auctions&status=ENCERRADO',
        bgColorClass: 'bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300',
      },
    ];

    return (
      <div className="space-y-12">
        <HeroCarousel />

        <section>
          <h2 className="text-2xl font-bold text-center mb-6 font-headline">Explorar por Modalidade</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5">
            {filterLinksData.map((card) => (
              <FilterLinkCard
                key={card.title}
                title={card.title}
                subtitle={card.subtitle}
                imageUrl={card.imageUrl}
                imageAlt={card.imageAlt}
                dataAiHint={card.dataAiHint}
                link={card.link}
                bgColorClass={card.bgColorClass}
              />
            ))}
          </div>
        </section>

        {featuredLots.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-center mb-6 font-headline flex items-center justify-center">
              <Star className="h-7 w-7 mr-2 text-amber-500" /> Lotes em Destaque
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {featuredLots.map((lot) => {
                const parentAuction = allAuctions.find(a => a.id === lot.auctionId);
                return (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                    auction={parentAuction}
                    platformSettings={platformSettings}
                    badgeVisibilityConfig={platformSettings.sectionBadgeVisibility?.featuredLots}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h1 className="text-3xl font-bold mb-2 text-center font-headline">Leilões em Destaque</h1>
          <p className="text-muted-foreground text-center mb-8">Descubra itens únicos e faça seus lances.</p>

          {featuredAuctions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {featuredAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Nenhum leilão em destaque no momento</h2>
              <p className="text-muted-foreground">Por favor, verifique mais tarde.</p>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error: any) {
    console.error("[HomePage Server-Side Error Catcher]", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h1 className="text-2xl font-bold text-destructive">Erro ao Renderizar a Página Inicial</h1>
        <p className="text-muted-foreground mt-2">
          Ocorreu um erro inesperado ao tentar carregar esta página.
        </p>
        <p className="text-sm text-muted-foreground mt-1">Por favor, tente recarregar ou volte mais tarde.</p>
        <pre className="mt-4 text-xs bg-muted p-2 rounded text-left overflow-auto max-w-md">
          Detalhe do erro (visível em desenvolvimento):
          {error.message}
          {error.stack && `\nStack:\n${error.stack.substring(0, 300)}...`}
        </pre>
      </div>
    );
  }
}
