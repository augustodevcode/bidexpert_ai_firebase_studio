// src/app/home-page-client.tsx
'use client';

import HeroSection from '@/components/hero-section';
import ClosingSoonCarousel from '@/components/closing-soon-carousel';
import TopCategories from '@/components/top-categories';
import FilterLinkCard from '@/app/filter-link-card';
import PromoCard from '@/app/promo-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rocket, GaugeCircle, Target, TrendingUp, Clock3, Layers, Settings, Bell, LogIn } from 'lucide-react';
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
import { RadarOpportunityCard, RadarCalendar, RadarPreferencesModal } from '@/components/radar';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

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
  closingSoonLots = []
}: HomePageClientProps & { platformSettings: PlatformSettings }) {
  const router = useRouter();
  const { userProfileWithPermissions } = useAuth();
  const isLoggedIn = !!userProfileWithPermissions;
  
  const numberFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const betaAuctionStatuses: Array<Auction['status']> = ['ABERTO', 'ABERTO_PARA_LANCES', 'EM_BREVE'];
  const betaLotStatuses: Array<Lot['status']> = ['ABERTO_PARA_LANCES'];
  const activeAuctions = allAuctions.filter(auction => betaAuctionStatuses.includes(auction.status));
  const highDemandLots = (closingSoonLots.length > 0 ? closingSoonLots : allLots)
    .filter(lot => betaLotStatuses.includes(lot.status))
    .slice(0, 9);
  const pipelineAuctions = allAuctions
    .filter(auction => auction.auctionDate)
    .sort((a, b) => new Date(a.auctionDate || '').getTime() - new Date(b.auctionDate || '').getTime())
    .slice(0, 20);
  const strategicCategories = categories
    .slice()
    .sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0))
    .slice(0, 6);

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

  const handleRequestLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="space-y-10">
      {/* Hero Section com Stats */}
      <section className="rounded-3xl glass-panel px-6 sm:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          <div className="flex-1 space-y-4">
            <Badge variant="secondary" className="uppercase tracking-wide text-xs">
              Radar de Leilões
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold font-headline text-foreground">
              Inteligência de mercado para decidir rápido e negociar melhor.
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">{heroSupportCopy}</p>
            <p className="text-muted-foreground/80 text-sm sm:text-base max-w-2xl">
              Monitoramos seus leilões preferidos, alertas de estoque e a agenda da semana para que você foque apenas nos lances estratégicos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/search?type=lots&sort=trending">Explorar oportunidades</Link>
              </Button>
              <RadarPreferencesModal 
                categories={categories} 
                isLoggedIn={isLoggedIn}
                onRequestLogin={handleRequestLogin}
                trigger={
                  <Button size="lg" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Alertas
                  </Button>
                }
              />
            </div>
            <div className="flex flex-wrap gap-4 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Atualizado em tempo real</div>
              <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> Curadoria inteligente de lotes</div>
              <div className="flex items-center gap-2"><Bell className="h-4 w-4" /> Alertas personalizados</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full lg:w-[380px]">
            {quickStats.map(stat => (
              <Card key={stat.label} className="bg-secondary/50 border-border">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardDescription className="text-xs flex items-center gap-1">
                    <stat.icon className="h-3.5 w-3.5" /> {stat.label}
                  </CardDescription>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">{stat.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA para usuários não logados */}
      {!isLoggedIn && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-lg">Configure seus alertas personalizados</h3>
              <p className="text-muted-foreground text-sm">Crie uma conta gratuita e receba notificações sobre lotes que combinam com seu perfil.</p>
            </div>
            <Button asChild>
              <Link href="/auth/register">
                <LogIn className="h-4 w-4 mr-2" />
                Criar conta grátis
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Radar de Oportunidades com fotos */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-headline">Radar de Oportunidades</h2>
            <p className="text-muted-foreground">Lotes com maior competição e tempo crítico</p>
          </div>
          <div className="flex items-center gap-2">
            <RadarPreferencesModal 
              categories={categories} 
              isLoggedIn={isLoggedIn}
              onRequestLogin={handleRequestLogin}
            />
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?type=lots&sort=ending">Ver todos</Link>
            </Button>
          </div>
        </div>
        
        {highDemandLots.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum lote ativo encontrado para o radar.</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/search?type=lots">Explorar todos os lotes</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {highDemandLots.map(lot => {
              const auction = allAuctions.find(a => a.id === lot.auctionId);
              return (
                <RadarOpportunityCard 
                  key={lot.id} 
                  lot={lot} 
                  auction={auction} 
                  platformSettings={platformSettings} 
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Calendário Agenda estilo Outlook */}
      <RadarCalendar auctions={pipelineAuctions} />

      {/* Segmentos em Alta */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-headline">Segmentos em Alta</h2>
            <p className="text-muted-foreground">Categorias com maior liquidez nos últimos dias</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/search?type=lots&tab=categories">Ver todas</Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategicCategories.map(category => {
            const assets = getCategoryAssets(category.name);
            return (
              <Card key={category.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <Link href={`/category/${category.slug}`}>
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                    {category.coverImageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                        style={{ backgroundImage: `url(${category.coverImageUrl})` }}
                      />
                    )}
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <Badge variant="secondary" className="w-fit mb-2">
                        {category.itemCount || 0} lotes disponíveis
                      </Badge>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description || 'Segmento com oportunidades em destaque.'}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Tendência</span>
                      <Badge variant="outline" className="text-xs">
                        {category.trendLabel || 'Estável'}
                      </Badge>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Final */}
      <Card className="bg-muted/40">
        <CardContent className="py-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Quer vender com protagonismo?</h3>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
            Ative o modo consignor para acompanhar propostas de liquidez e conecte-se com milhares de compradores qualificados.
          </p>
          <Button size="lg" asChild>
            <Link href="/sell-with-us">Publicar ativo</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
