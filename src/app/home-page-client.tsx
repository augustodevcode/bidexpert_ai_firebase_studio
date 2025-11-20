// src/app/home-page-client.tsx
'use client';

import HeroSection from '@/components/hero-section';
import ClosingSoonCarousel from '@/components/closing-soon-carousel';
import TopCategories from '@/components/top-categories';
import FilterLinkCard from '@/app/filter-link-card';
import PromoCard from '@/app/promo-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rocket, GaugeCircle, Target, TrendingUp, Clock3, Layers } from 'lucide-react';
import Link from 'next/link';
import type { Auction, Lot, LotCategory, SellerProfileInfo, PlatformSettings } from '@/types';
import { getCategoryAssets } from '@/lib/ui-helpers';
import FeaturedSellers from '@/components/featured-sellers';
import BidExpertCard from '@/components/BidExpertCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type HomeVariant = 'classic' | 'beta';

interface HomePageClientProps {
  platformSettings: PlatformSettings | null;
  allAuctions: Auction[];
  allLots: Lot[];
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
  closingSoonLots?: Lot[];
  variant?: HomeVariant;
}

export default function HomePageClient(props: HomePageClientProps) {
  const { platformSettings } = props;

  if (!platformSettings) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">Erro ao carregar as configurações da plataforma.</p>
      </div>
    );
  }

  if (props.variant === 'beta') {
    return <HomeExperienceBeta {...props} platformSettings={platformSettings} />;
  }

  return <HomeExperienceClassic {...props} platformSettings={platformSettings} />;
}

function HomeExperienceClassic({
  platformSettings,
  allAuctions,
  allLots,
  categories,
  sellers,
  closingSoonLots = []
}: HomePageClientProps & { platformSettings: PlatformSettings }) {
  const activeLotStatuses: Array<Lot['status']> = ['ABERTO_PARA_LANCES'];
  const activeAuctionStatuses: Array<Auction['status']> = ['ABERTO_PARA_LANCES', 'EM_BREVE', 'ABERTO'];

  const featuredLots = allLots
    .filter(l => l.isFeatured && activeLotStatuses.includes(l.status))
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8);
  const recentActiveLots = allLots
    .filter(l => activeLotStatuses.includes(l.status))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);
  const lotsToDisplay = featuredLots.length > 0 ? featuredLots : recentActiveLots;
  const lotsTitle = featuredLots.length > 0 ? 'Lotes em Destaque' : 'Lotes Recentes';

  const featuredAuctions = allAuctions
    .filter(a => a.isFeaturedOnMarketplace && activeAuctionStatuses.includes(a.status))
    .sort((a, b) => {
      const dateA = b.auctionDate ? new Date(b.auctionDate).getTime() : 0;
      const dateB = a.auctionDate ? new Date(a.auctionDate).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 4);
  const recentActiveAuctions = allAuctions
    .filter(a => activeAuctionStatuses.includes(a.status))
    .slice(0, 4);
  const auctionsToDisplay = featuredAuctions.length > 0 ? featuredAuctions : recentActiveAuctions;
  const auctionsTitle = featuredAuctions.length > 0 ? 'Leilões em Destaque' : 'Leilões Recentes';

  const featuredCategories = categories
    .slice()
    .sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0))
    .slice(0, 3);
  const featuredSellers = sellers.filter(s => s.logoUrl).slice(0, 12);

  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-20">
      <HeroSection />

      {closingSoonLots.length > 0 && (
        <ClosingSoonCarousel lots={closingSoonLots} auctions={allAuctions} platformSettings={platformSettings} />
      )}

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
          {lotsToDisplay.map(item => (
            <BidExpertCard
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
          {auctionsToDisplay.map(item => (
            <BidExpertCard key={item.id} item={item} type="auction" platformSettings={platformSettings} />
          ))}
        </div>
      </section>

      <FeaturedSellers sellers={featuredSellers} />

      <section className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold font-headline text-center">Navegue por Categorias</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCategories.map(category => {
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
            );
          })}
        </div>
      </section>
    </div>
  );
}

function HomeExperienceBeta({
  platformSettings,
  allAuctions,
  allLots,
  categories,
  sellers,
  closingSoonLots = []
}: HomePageClientProps & { platformSettings: PlatformSettings }) {
  const numberFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const betaAuctionStatuses: Array<Auction['status']> = ['ABERTO', 'ABERTO_PARA_LANCES', 'EM_BREVE'];
  const betaLotStatuses: Array<Lot['status']> = ['ABERTO_PARA_LANCES'];
  const activeAuctions = allAuctions.filter(auction => betaAuctionStatuses.includes(auction.status));
  const highDemandLots = (closingSoonLots.length > 0 ? closingSoonLots : allLots)
    .filter(lot => betaLotStatuses.includes(lot.status))
    .slice(0, 6);
  const pipelineAuctions = allAuctions
    .filter(auction => auction.auctionDate)
    .sort((a, b) => new Date(a.auctionDate || '').getTime() - new Date(b.auctionDate || '').getTime())
    .slice(0, 5);
  const strategicCategories = categories
    .slice()
    .sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0))
    .slice(0, 6);
  const trustedSellers = sellers.filter(seller => seller.logoUrl).slice(0, 4);

  const potentialVolume = highDemandLots.reduce((acc, lot) => acc + (lot.price || 0), 0);
  const averageDiscount = (() => {
    const samples = highDemandLots
      .filter(lot => typeof lot.evaluationValue === 'number' && typeof lot.price === 'number' && lot.evaluationValue > 0);
    if (!samples.length) return null;
    const ratio = samples.reduce((acc, lot) => acc + (1 - Number(lot.price) / Number(lot.evaluationValue!)), 0) / samples.length;
    return Math.max(0, Math.min(1, ratio));
  })();

  const quickStats = [
    {
      label: 'Leilões ativos',
      value: activeAuctions.length.toString().padStart(2, '0'),
      helper: `${activeAuctions.filter(a => a.isFeaturedOnMarketplace).length} em destaque`,
      icon: GaugeCircle,
    },
    {
      label: 'Lotes quentes',
      value: highDemandLots.length.toString().padStart(2, '0'),
      helper: 'Encerram em até 7 dias',
      icon: Target,
    },
    {
      label: 'Volume potencial',
      value: numberFormatter.format(potentialVolume || 0),
      helper: 'Baseado nos lotes prioritários',
      icon: TrendingUp,
    },
    {
      label: 'Desconto médio',
      value: averageDiscount !== null ? `${Math.round(averageDiscount * 100)}%` : 'N/D',
      helper: 'Vs. valor de avaliação',
      icon: Rocket,
    },
  ];

  const heroSupportCopy = platformSettings?.siteTagline || 'Aprimore suas decisões de compra com sinais de demanda em tempo real.';

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-8 py-10 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1 space-y-4">
            <Badge variant="secondary" className="bg-white/10 text-white uppercase tracking-wide text-xs">Homepage Beta</Badge>
            <h1 className="text-3xl md:text-4xl font-semibold font-headline">
              Inteligência de mercado para decidir rápido e negociar melhor.
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">{heroSupportCopy}</p>
            <p className="text-white/70 text-base max-w-2xl">
              Monitoramos seus leilões preferidos, alertas de estoque e a agenda da semana para que você foque apenas nos lances estratégicos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/search?type=lots&sort=trending">Explorar oportunidades</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                <Link href="/dashboard/overview">Ver meu painel</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 pt-4 text-sm text-white/80">
              <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Atualizado em tempo real</div>
              <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> Curadoria inteligente de lotes</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-[380px]">
            {quickStats.map(stat => (
              <Card key={stat.label} className="bg-white/10 border-white/20 text-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs text-white/70 flex items-center gap-1">
                    <stat.icon className="h-3.5 w-3.5" /> {stat.label}
                  </CardDescription>
                  <CardTitle className="text-2xl">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 text-sm">{stat.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Radar de oportunidades</CardTitle>
                <CardDescription>Lotes com maior competição e tempo crítico</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/favorites">Gerenciar lista</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {highDemandLots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Nenhum lote ativo encontrado para o radar.</div>
            )}
            {highDemandLots.map(lot => {
              const auction = allAuctions.find(auction => auction.id === lot.auctionId);
              const deadlineLabel = lot.endDate
                ? formatDistanceToNowStrict(new Date(lot.endDate), { locale: ptBR, addSuffix: false })
                : 'Sem data';
              const totalBids = (() => {
                const value = (lot as Record<string, unknown>)?.['bidCount'] ?? (lot as Record<string, unknown>)?.['totalBids'];
                return typeof value === 'number' ? value : 0;
              })();
              const demandScore = Math.min(100, ((lot.views || 0) / 50) * 10 + totalBids * 5);
              const priceLabel = numberFormatter.format(lot.price || 0);
              return (
                <div key={lot.id} className="flex flex-col md:flex-row gap-4 border rounded-xl p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{lot.categoryName || 'Lote'}</Badge>
                      {auction?.auctionDate && (
                        <span className="text-xs text-muted-foreground">Leilão {format(new Date(auction.auctionDate), 'dd/MM HH:mm')}</span>
                      )}
                    </div>
                    <p className="font-semibold text-lg mt-1">{lot.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {lot.description?.slice(0, 140) || 'Detalhes completos disponíveis na página do lote.'}
                    </p>
                  </div>
                  <div className="md:w-56 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lance atual</span>
                      <span className="font-semibold">{priceLabel}</span>
                    </div>
                    <Progress value={demandScore} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Score de demanda</span>
                      <span>{Math.round(demandScore)}%</span>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      Encerra em {deadlineLabel}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agenda da semana</CardTitle>
            <CardDescription>Principais leilões e ações programadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineAuctions.length === 0 && (
              <div className="text-muted-foreground text-sm">Nenhum evento futuro registrado.</div>
            )}
            {pipelineAuctions.map(event => (
              <div key={event.id} className="rounded-xl border p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  {event.auctionDate ? format(new Date(event.auctionDate), "EEEE',' dd 'de' MMMM", { locale: ptBR }) : 'Sem data'}
                </p>
                <p className="font-medium text-base">{event.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description || 'Acompanhe para ajustar sua estratégia.'}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span>{event.city || 'On-line'}</span>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/auctions/${event.id}`}>Detalhes</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Segmentos em alta</CardTitle>
            <CardDescription>Categorias com maior liquidez nos últimos dias</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {strategicCategories.map(category => (
              <div key={category.id} className="rounded-2xl border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{category.name}</p>
                  <Badge variant="outline">{category.itemCount || 0} lotes</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{category.description || 'Segmento com oportunidades em destaque.'}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tendência</span>
                  <span>{category.trendLabel || 'Estável'}</span>
                </div>
                <Button size="sm" className="w-full" variant="outline" asChild>
                  <Link href={`/category/${category.slug}`}>Explorar categoria</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rede de confiança</CardTitle>
            <CardDescription>Comitentes recomendados para lotes exclusivos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trustedSellers.length === 0 && (
              <p className="text-muted-foreground text-sm">Nenhum comitente com selo premium disponível.</p>
            )}
            {trustedSellers.map(seller => (
              <div key={seller.id} className="border rounded-xl p-3">
                <p className="font-medium">{seller.name}</p>
                <p className="text-xs text-muted-foreground">{seller.city ? `${seller.city} - ${seller.state}` : 'Localidade não informada'}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {seller.description || 'Especialista em ativos estratégicos.'}
                </p>
                <Button size="sm" variant="ghost" className="px-0" asChild>
                  <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`}>Ver perfil</Link>
                </Button>
              </div>
            ))}
            <div className="rounded-2xl bg-muted/60 p-4 text-sm">
              <p className="font-semibold">Quer vender com protagonismo?</p>
              <p className="text-muted-foreground">Ative o modo consignor para acompanhar propostas de liquidez.</p>
              <Button size="sm" className="mt-3 w-full" asChild>
                <Link href="/sell-with-us">Publicar ativo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
