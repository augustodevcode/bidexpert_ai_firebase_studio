/**
 * @fileoverview Cliente da home com controle de seções baseado em configurações da plataforma.
 */
'use client';

import HeroSection from '@/components/hero-section';
import ClosingSoonCarousel from '@/components/closing-soon-carousel';
import HotDealCard from '@/components/hot-deal-card';
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
      <div className="wrapper-error-msg" data-ai-id="homepage-error-boundary">
        <p className="text-error-msg" data-ai-id="homepage-error-text">Erro ao carregar as configurações da plataforma.</p>
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
  const isSuperOpportunitiesEnabled = platformSettings.marketingSiteAdsSuperOpportunitiesEnabled ?? true;

  return (
    <div className="wrapper-homepage-experience-classic" data-ai-id="homepage-classic">
      <HeroSection />

      {closingSoonLots.length > 0 && isSuperOpportunitiesEnabled && (
        <ClosingSoonCarousel lots={closingSoonLots} auctions={allAuctions} platformSettings={platformSettings} />
      )}

      {/* Hot Deal Section - Lotes com encerramento próximo */}
      {closingSoonLots.length > 0 && (
        <HotDealCard 
          lots={closingSoonLots.slice(0, 5)} 
          auctions={allAuctions} 
          platformSettings={platformSettings}
          title="Oferta Imperdível de Hoje"
          autoPlay={true}
          autoPlayInterval={10000}
        />
      )}

      <section className="section-featured-lots" data-ai-id="homepage-featured-lots-section">
        <div className="wrapper-section-header" data-ai-id="homepage-featured-lots-header">
          <h2 className="header-section-title" data-ai-id="homepage-featured-lots-title">{lotsTitle}</h2>
          <div className="wrapper-section-actions" data-ai-id="homepage-featured-lots-actions">
            <Button variant="outline" size="sm" asChild className="btn-view-all" data-ai-id="homepage-view-all-lots">
              <Link href="/search?type=lots">
                Ver Todos <ArrowRight className="icon-arrow-right" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid-lots-grid-mode" data-ai-id="homepage-lots-grid">
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

      <div className="grid-promo-cards" data-ai-id="homepage-promo-grid">
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

      <section className="section-featured-auctions" data-ai-id="homepage-featured-auctions-section">
        <div className="wrapper-section-header" data-ai-id="homepage-featured-auctions-header">
          <h2 className="header-section-title" data-ai-id="homepage-featured-auctions-title">{auctionsTitle}</h2>
          <Button variant="outline" size="sm" asChild className="btn-view-all" data-ai-id="homepage-view-all-auctions">
            <Link href="/search?type=auctions">
              Ver Todos <ArrowRight className="icon-arrow-right" />
            </Link>
          </Button>
        </div>
        <div className="grid-lots-grid-mode" data-ai-id="homepage-auctions-grid">
          {auctionsToDisplay.map(item => (
            <BidExpertCard key={item.id} item={item} type="auction" platformSettings={platformSettings} />
          ))}
        </div>
      </section>

      <FeaturedSellers sellers={featuredSellers} />

      <section className="section-browse-categories" data-ai-id="homepage-categories-section">
        <h2 className="header-section-title-centered" data-ai-id="homepage-categories-title">Navegue por Categorias</h2>
        <div className="grid-categories-featured" data-ai-id="homepage-categories-grid">
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
    <div className="wrapper-homepage-experience-beta" data-ai-id="homepage-beta">
      {/* Hero Section com Stats */}
      <section className="section-hero-beta" data-ai-id="homepage-beta-hero-section">
        <div className="container-hero-beta" data-ai-id="homepage-beta-hero-container">
          <div className="wrapper-hero-beta-content" data-ai-id="homepage-beta-hero-content">
            <Badge variant="secondary" className="badge-hero-beta" data-ai-id="homepage-beta-badge">
              Radar de Leilões
            </Badge>
            <h1 className="header-hero-beta" data-ai-id="homepage-beta-hero-title">
              Inteligência de mercado para decidir rápido e negociar melhor.
            </h1>
            <p className="text-hero-beta-desc" data-ai-id="homepage-beta-hero-desc">{heroSupportCopy}</p>
            <p className="text-hero-beta-subdesc" data-ai-id="homepage-beta-hero-subdesc">
              Monitoramos seus leilões preferidos, alertas de estoque e a agenda da semana para que você foque apenas nos lances estratégicos.
            </p>
            <div className="wrapper-hero-beta-actions" data-ai-id="homepage-beta-hero-actions">
              <Button size="lg" variant="secondary" asChild className="btn-hero-beta-primary" data-ai-id="homepage-beta-hero-explore">
                <Link href="/search?type=lots&sort=trending">Explorar oportunidades</Link>
              </Button>
              <RadarPreferencesModal 
                categories={categories} 
                isLoggedIn={isLoggedIn}
                onRequestLogin={handleRequestLogin}
                trigger={
                  <Button size="lg" variant="outline" className="btn-hero-beta-secondary" data-ai-id="homepage-beta-hero-alerts">
                    <Settings className="icon-hero-beta-btn" />
                    Configurar Alertas
                  </Button>
                }
              />
            </div>
            <div className="wrapper-hero-beta-features" data-ai-id="homepage-beta-hero-features">
              <div className="item-hero-beta-feature"><Clock3 className="icon-hero-beta-feature" /> Atualizado em tempo real</div>
              <div className="item-hero-beta-feature"><Layers className="icon-hero-beta-feature" /> Curadoria inteligente de lotes</div>
              <div className="item-hero-beta-feature"><Bell className="icon-hero-beta-feature" /> Alertas personalizados</div>
            </div>
          </div>
          <div className="grid-hero-beta-stats" data-ai-id="homepage-beta-stats-grid">
            {quickStats.map(stat => (
              <Card key={stat.label} className="card-hero-beta-stat" data-ai-id={`homepage-beta-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="header-hero-beta-stat">
                  <CardDescription className="desc-hero-beta-stat">
                    <stat.icon className="icon-hero-beta-stat" /> {stat.label}
                  </CardDescription>
                  <CardTitle className="title-hero-beta-stat">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent className="content-hero-beta-stat">
                  <p className="helper-hero-beta-stat">{stat.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA para usuários não logados */}
      {!isLoggedIn && (
        <Card className="card-cta-auth" data-ai-id="homepage-beta-cta-auth">
          <CardContent className="content-cta-auth">
            <div className="wrapper-cta-auth-text">
              <h3 className="header-cta-auth">Configure seus alertas personalizados</h3>
              <p className="desc-cta-auth">Crie uma conta gratuita e receba notificações sobre lotes que combinam com seu perfil.</p>
            </div>
            <Button asChild className="btn-cta-auth" data-ai-id="homepage-beta-cta-auth-button">
              <Link href="/auth/register">
                <LogIn className="icon-cta-auth" />
                Criar conta grátis
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Radar de Oportunidades com fotos */}
      <section className="section-radar-opportunities" data-ai-id="homepage-beta-radar-section">
        <div className="wrapper-section-header" data-ai-id="homepage-beta-radar-header">
          <div className="wrapper-section-title">
            <h2 className="header-section-title" data-ai-id="homepage-beta-radar-title">Radar de Oportunidades</h2>
            <p className="desc-section-subtitle">Lotes com maior competição e tempo crítico</p>
          </div>
          <div className="wrapper-section-actions">
            <RadarPreferencesModal 
              categories={categories} 
              isLoggedIn={isLoggedIn}
              onRequestLogin={handleRequestLogin}
            />
            <Button variant="outline" size="sm" asChild className="btn-view-all" data-ai-id="homepage-beta-radar-view-all">
              <Link href="/search?type=lots&sort=ending">Ver todos</Link>
            </Button>
          </div>
        </div>
        
        {highDemandLots.length === 0 ? (
          <div className="wrapper-empty-state" data-ai-id="homepage-beta-radar-empty">
            <Target className="icon-empty-state" />
            <p className="text-empty-state">Nenhum lote ativo encontrado para o radar.</p>
            <Button variant="outline" size="sm" className="btn-empty-state-action" asChild data-ai-id="homepage-beta-radar-empty-action">
              <Link href="/search?type=lots">Explorar todos os lotes</Link>
            </Button>
          </div>
        ) : (
          <div className="grid-radar-opportunities" data-ai-id="homepage-beta-radar-grid">
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
      <section className="section-trending-segments" data-ai-id="homepage-beta-segments-section">
        <div className="wrapper-section-header" data-ai-id="homepage-beta-segments-header">
          <div className="wrapper-section-title">
            <h2 className="header-section-title" data-ai-id="homepage-beta-segments-title">Segmentos em Alta</h2>
            <p className="desc-section-subtitle">Categorias com maior liquidez nos últimos dias</p>
          </div>
          <Button variant="outline" size="sm" asChild className="btn-view-all" data-ai-id="homepage-beta-segments-view-all">
            <Link href="/search?type=lots&tab=categories">Ver todas</Link>
          </Button>
        </div>
        <div className="grid-trending-segments" data-ai-id="homepage-beta-segments-grid">
          {strategicCategories.map(category => {
            const assets = getCategoryAssets(category.name);
            return (
              <Card key={category.id} className="card-trending-segment" data-ai-id={`homepage-beta-segment-${category.slug}`}>
                <Link href={`/category/${category.slug}`} className="link-card-trending">
                  <div className="wrapper-trending-image" data-ai-id="homepage-beta-segment-image-wrapper">
                    {category.coverImageUrl && (
                      <div 
                        className="img-trending-bg"
                        style={{ backgroundImage: `url(${category.coverImageUrl})` }}
                      />
                    )}
                    <div className="wrapper-trending-label">
                      <Badge variant="secondary" className="badge-trending-count" data-ai-id="homepage-beta-segment-count">
                        {category.itemCount || 0} lotes disponíveis
                      </Badge>
                      <h3 className="header-trending-name">{category.name}</h3>
                    </div>
                  </div>
                  <CardContent className="content-trending-segment">
                    <p className="text-trending-desc">
                      {category.description || 'Segmento com oportunidades em destaque.'}
                    </p>
                    <div className="wrapper-trending-footer">
                      <span className="text-trending-footer-label">Tendência</span>
                      <Badge variant="outline" className="badge-trending-label" data-ai-id="homepage-beta-segment-trend">
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
      <Card className="card-cta-footer" data-ai-id="homepage-beta-cta-footer">
        <CardContent className="content-cta-footer">
          <h3 className="header-cta-footer">Quer vender com protagonismo?</h3>
          <p className="desc-cta-footer">
            Ative o modo consignor para acompanhar propostas de liquidez e conecte-se com milhares de compradores qualificados.
          </p>
          <Button size="lg" asChild className="btn-cta-footer" data-ai-id="homepage-beta-cta-footer-button">
            <Link href="/sell-with-us">Publicar ativo</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
