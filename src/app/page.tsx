

import AuctionCard from '@/components/auction-card';
import AuctionFilters from '@/components/auction-filters';
import HeroCarousel from '@/components/hero-carousel';
import PromoCard from '@/components/promo-card';
import FilterLinkCard from '@/components/filter-link-card'; // Import the new component
import { sampleAuctions, sampleLots } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import Link from 'next/link';
import { Landmark, Scale, FileText, Tags, CalendarX, CheckSquare, Star } from 'lucide-react';

export default function HomePage() {
  const auctions: Auction[] = sampleAuctions; // Em um aplicativo real, busque esses dados
  const featuredLots: Lot[] = sampleLots.filter(lot => lot.isFeatured).slice(0, 3); // Pegar até 3 lotes em destaque

  const filterLinksData = [
    {
      title: 'Leilões Judiciais',
      subtitle: 'Oportunidades de processos judiciais.',
      imageUrl: 'https://images.unsplash.com/photo-1589216532372-1c2a367900d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxMZWlsJUMzJUEzbyUyMEp1ZGljaWFsfGVufDB8fHx8MTc0OTk0MjE4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      imageAlt: 'Ícone Leilões Judiciais',
      dataAiHint: 'gavel justice',
      link: '/search?type=judicial',
      bgColorClass: 'bg-sky-50 dark:bg-sky-900/40 hover:border-sky-300',
    },
    {
      title: 'Leilões Extrajudiciais',
      subtitle: 'Negociações diretas e mais ágeis.',
      imageUrl: 'https://images.unsplash.com/photo-1654588834754-33346e3ee095?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOHx8bGVpbCVDMyVBM28lMjBleHRyYSUyMGp1ZGljaWFsfGVufDB8fHx8MTc0OTk0MzI5NXww&ixlib=rb-4.1.0&q=80&w=1080',
      imageAlt: 'Ícone Leilões Extrajudiciais',
      dataAiHint: 'document agreement',
      link: '/search?type=extrajudicial',
      bgColorClass: 'bg-teal-50 dark:bg-teal-900/40 hover:border-teal-300',
    },
    {
      title: 'Venda Direta',
      subtitle: 'Compre sem a disputa de lances.',
      imageUrl: 'https://images.unsplash.com/photo-1642543348745-03b1219733d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOXx8dmVuZGVyJTIwc2VtJTIwaW50ZXJtZWRpJUMzJUExcmlvc3xlbnwwfHx8fDE3NDk5NDM2NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      imageAlt: 'Ícone Venda Direta',
      dataAiHint: 'property deal',
      link: '/search?type=direct_sale',
      bgColorClass: 'bg-amber-50 dark:bg-amber-900/40 hover:border-amber-300',
    },
    {
      title: 'Em Segunda Praça',
      subtitle: 'Novas chances com valores atrativos.',
      imageUrl: 'https://placehold.co/100x100.png',
      imageAlt: 'Ícone Segunda Praça',
      dataAiHint: 'auction discount',
      link: '/search?stage=second_praça',
      bgColorClass: 'bg-violet-50 dark:bg-violet-900/40 hover:border-violet-300',
    },
    {
      title: 'Leilões Encerrados',
      subtitle: 'Consulte o histórico de resultados.',
      imageUrl: 'https://placehold.co/100x100.png',
      imageAlt: 'Ícone Leilões Encerrados',
      dataAiHint: 'archive checkmark',
      link: '/search?status=encerrado',
      bgColorClass: 'bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300',
    },
    {
      title: 'Leilões Cancelados',
      subtitle: 'Veja os leilões que foram cancelados.',
      imageUrl: 'https://placehold.co/100x100.png',
      imageAlt: 'Ícone Leilões Cancelados',
      dataAiHint: 'stamp cancel',
      link: '/search?status=cancelado',
      bgColorClass: 'bg-rose-50 dark:bg-rose-900/40 hover:border-rose-300',
    },
  ];

  return (
    <div className="space-y-12">
      <HeroCarousel />

      <section>
        <h2 className="text-2xl font-bold text-center mb-6 font-headline">Explorar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredLots.map((lot) => (
              <PromoCard
                key={lot.id}
                title={lot.title}
                description={`A partir de R$ ${lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${lot.location}`}
                imageUrl={lot.imageUrl}
                imageAlt={lot.title}
                dataAiHint={lot.dataAiHint || 'imagem lote destaque'}
                link={`/auctions/${lot.auctionId}/lots/${lot.id}`}
                bgColorClass="bg-gradient-to-br from-primary/10 via-background to-accent/10"
              />
            ))}
          </div>
        </section>
      )}

      <section className="text-center py-6 bg-accent/10 rounded-lg">
        <p className="text-lg font-semibold text-accent-foreground">
          Até 50% de Desconto em Moda e Vestuário de Verão.{' '}
          <Link href="/search?category=fashion" className="font-bold underline hover:text-primary">
            Compre Agora
          </Link>
        </p>
      </section>
      
      <div>
        <h1 className="text-3xl font-bold mb-2 text-center font-headline">Leilões Ativos</h1>
        <p className="text-muted-foreground text-center mb-8">Descubra itens únicos e faça seus lances.</p>
        
        <AuctionFilters />

        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Nenhum leilão encontrado</h2>
            <p className="text-muted-foreground">Por favor, verifique mais tarde ou ajuste seus filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

