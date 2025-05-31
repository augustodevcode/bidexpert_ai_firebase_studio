
import AuctionCard from '@/components/auction-card';
import AuctionFilters from '@/components/auction-filters';
import HeroCarousel from '@/components/hero-carousel';
import PromoCard from '@/components/promo-card';
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction } from '@/types';
import Link from 'next/link';

export default function HomePage() {
  const auctions: Auction[] = sampleAuctions; // Em um aplicativo real, busque esses dados

  const promoCardsData = [
    {
      title: 'Headset Sem Fio Pulse X2',
      description: 'Explore a nova geração.',
      imageUrl: 'https://placehold.co/200x200.png',
      imageAlt: 'Headset Sem Fio Pulse X2',
      dataAiHint: 'headset gamer',
      link: '/search?category=electronics',
      bgColorClass: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      title: 'Controle Gamer com Fio',
      description: 'Licenciado pelo Xbox.',
      imageUrl: 'https://placehold.co/200x200.png',
      imageAlt: 'Controle Gamer com Fio',
      dataAiHint: 'controle video game',
      link: '/search?category=gaming',
      bgColorClass: 'bg-orange-50 dark:bg-orange-900/30',
    },
    {
      title: 'Galaxy Watch Active 2',
      description: 'Bluetooth & LTF.',
      imageUrl: 'https://placehold.co/200x200.png',
      imageAlt: 'Galaxy Watch Active 2',
      dataAiHint: 'smartwatch relogio',
      link: '/search?category=wearables',
      bgColorClass: 'bg-slate-100 dark:bg-slate-800/30',
    },
  ];

  return (
    <div className="space-y-12">
      <HeroCarousel />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {promoCardsData.map((card) => (
          <PromoCard
            key={card.title}
            title={card.title}
            description={card.description}
            imageUrl={card.imageUrl}
            imageAlt={card.imageAlt}
            dataAiHint={card.dataAiHint}
            link={card.link}
            bgColorClass={card.bgColorClass}
          />
        ))}
      </section>

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
