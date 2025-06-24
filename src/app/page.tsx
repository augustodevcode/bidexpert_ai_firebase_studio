
import AuctionCard from '@/components/auction-card';
import HeroCarousel from '@/components/hero-carousel';
import FilterLinkCard from '@/components/filter-link-card';
import LotCard from '@/components/lot-card';
import type { Auction, Lot, PlatformSettings } from '@/types';
import Link from 'next/link';
import { Landmark, Scale, FileText, Tags, CalendarX, CheckSquare, Star, FileText as FileTextIcon } from 'lucide-react';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getCategoryAssets } from '@/lib/sample-data'; // Corrected import path

export default async function HomePage() {
  try {
    const platformSettings = await getPlatformSettings();
    
    // Fetch data using server actions
    const allAuctions = await getAuctions();
    const allLots = await getLots();

    const auctions: Auction[] = allAuctions.slice(0, 10);
    const featuredLots: Lot[] = allLots.filter(lot => lot.isFeatured && lot.status === 'ABERTO_PARA_LANCES').slice(0, 10);

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
        title: 'Segunda Praça',
        subtitle: 'Novas chances com valores atrativos.',
        imageUrl: getCategoryAssets('Segunda Praça').bannerUrl,
        imageAlt: 'Ícone Segunda Praça',
        dataAiHint: getCategoryAssets('Segunda Praça').bannerAiHint,
        link: '/search?type=auctions&stage=second_praça', // Assuming a filter for second stage
        bgColorClass: 'bg-violet-50 dark:bg-violet-900/40 hover:border-violet-300',
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
      {
        title: 'Leilões Cancelados',
        subtitle: 'Veja os leilões que foram cancelados.',
        imageUrl: getCategoryAssets('Leilões Cancelados').bannerUrl,
        imageAlt: 'Ícone Leilões Cancelados',
        dataAiHint: getCategoryAssets('Leilões Cancelados').bannerAiHint,
        link: '/search?type=auctions&status=CANCELADO',
        bgColorClass: 'bg-rose-50 dark:bg-rose-900/40 hover:border-rose-300',
      },
    ];

    return (
      <div className="space-y-12">
        <HeroCarousel />

        <section>
          <h2 className="text-2xl font-bold text-center mb-6 font-headline">Explorar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5">
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
              {featuredLots.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  platformSettings={platformSettings}
                  badgeVisibilityConfig={platformSettings.sectionBadgeVisibility?.featuredLots}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h1 className="text-3xl font-bold mb-2 text-center font-headline">Leilões em Destaque</h1>
          <p className="text-muted-foreground text-center mb-8">Descubra itens únicos e faça seus lances.</p>

          {auctions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Nenhum leilão encontrado</h2>
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
