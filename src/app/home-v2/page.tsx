/**
 * @file Home V2 Beta Page (Updated)
 * @description New home page (v2) beta for evaluation with all segments
 * showcased. Inspired by Superbid, Mercado Bom Valor, Vip Leilões,
 * and Martfury visual style.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  ChevronRight, Car, Home, Cog, Laptop, ArrowRight,
  Gavel, Shield, TrendingUp, Users, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import {
  SEGMENT_ORDER,
  SEGMENT_CONFIGS,
  type SegmentType,
} from '@/components/home-v2';
import BidExpertCard from '@/components/BidExpertCard';
import {
  getSegmentEvents,
  getSegmentLots,
  getSegmentStats,
} from '@/components/home-v2/segment-data';
import EventCard from '@/components/home-v2/event-card';
import { prisma } from '@/lib/prisma';
// import LotCard from '@/components/home-v2/lot-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BidExpert - Leilões Online | Home v2 Beta',
  description: 'Plataforma de leilões online com veículos, imóveis, máquinas e tecnologia. Encontre oportunidades únicas com transparência e segurança.',
  keywords: ['leilão online', 'leilão de veículos', 'leilão de imóveis', 'leilão de máquinas'],
};

const SEGMENT_ICONS: Record<SegmentType, React.ElementType> = {
  veiculos: Car,
  imoveis: Home,
  maquinas: Cog,
  tecnologia: Laptop,
};

const SEGMENT_IMAGES: Record<SegmentType, string> = {
  veiculos: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
  imoveis: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  maquinas: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
  tecnologia: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
};

/**
 * Busca estatísticas públicas da plataforma para exibição na home page
 */
async function getPlatformPublicStats() {
  try {
    // Busca apenas estatísticas públicas relevantes
    const [
      totalUsers,
      totalAuctions,
      activeLots,
      totalSellers,
    ] = await Promise.all([
      // Total de usuários cadastrados
      prisma.user.count(),
      // Total de leilões (todos os status)
      prisma.auction.count(),
      // Lotes ativos (abertos para lances)
      prisma.lot.count({
        where: { status: 'ABERTO_PARA_LANCES' }
      }),
      // Total de vendedores/comitentes
      prisma.seller.count(),
    ]);

    return {
      totalUsers,
      totalAuctions,
      activeLots,
      totalSellers,
    };
  } catch (error) {
    console.error('Error fetching platform public stats:', error);
    // Retorna valores padrão em caso de erro
    return {
      totalUsers: 0,
      totalAuctions: 0,
      activeLots: 0,
      totalSellers: 0,
    };
  }
}

async function HeroSection() {
  const platformStats = await getPlatformPublicStats();

  return (
    <section className="relative min-h-[500px] md:min-h-[600px] overflow-hidden" data-testid="home-v2-hero">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80"
          alt="BidExpert Leilões"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl space-y-6">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            Nova Plataforma v2 Beta
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Leilões Online com
            <span className="text-primary"> Transparência</span> e
            <span className="text-primary"> Segurança</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-xl">
            Encontre veículos, imóveis, máquinas e muito mais com descontos exclusivos.
            Plataforma certificada com suporte dedicado.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="#segments">
                Explorar Segmentos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/faq#como-comprar">
                Como Funciona
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 pt-8">
            <div>
              <p className="text-3xl font-bold text-primary">
                {platformStats.activeLots > 0 ? `${platformStats.activeLots.toLocaleString()}+` : '0'}
              </p>
              <p className="text-sm text-muted-foreground">Lotes ativos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {platformStats.totalAuctions > 0 ? `${platformStats.totalAuctions.toLocaleString()}+` : '0'}
              </p>
              <p className="text-sm text-muted-foreground">Eventos realizados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {platformStats.totalUsers > 0 ? `${platformStats.totalUsers.toLocaleString()}+` : '0'}
              </p>
              <p className="text-sm text-muted-foreground">Usuários cadastrados</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function SegmentCards() {
  const statsPromises = SEGMENT_ORDER.map(segment =>
    getSegmentStats(segment).then(stats => ({ segment, ...stats }))
  );
  const allStats = await Promise.all(statsPromises);

  return (
    <section id="segments" className="py-12 md:py-16" data-testid="home-v2-segments">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nossos Segmentos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore categorias especializadas com curadoria técnica e suporte dedicado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SEGMENT_ORDER.map((segmentId, index) => {
            const config = SEGMENT_CONFIGS[segmentId];
            const Icon = SEGMENT_ICONS[segmentId];
            const stats = allStats.find(s => s.segment === segmentId);
            const imageUrl = SEGMENT_IMAGES[segmentId];

            return (
              <Link
                key={segmentId}
                href={`/${segmentId}`}
                data-testid={`segment-card-${segmentId}`}
              >
                <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={config.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="p-2 bg-background/90 rounded-lg backdrop-blur-sm">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {config.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {config.subtitle}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{stats?.eventsCount || 0} eventos</span>
                        <span>{stats?.lotsCount || 0} lotes</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

async function FeaturedSection({ platformSettings }: { platformSettings: any }) {
  const [vehicleEvents, realEstateEvents, vehicleLots, realEstateLots] = await Promise.all([
    getSegmentEvents('veiculos', 3),
    getSegmentEvents('imoveis', 3),
    getSegmentLots('veiculos', 4),
    getSegmentLots('imoveis', 4),
  ]);

  return (
    <section className="py-12 md:py-16 bg-muted/30" data-testid="home-v2-featured">
      <div className="container mx-auto px-4">
        {/* Featured Events */}
        <div className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos em Destaque</h2>
              <p className="text-muted-foreground mt-1">Os leilões mais aguardados</p>
            </div>
            <Link href="/search?type=auctions" className="text-primary hover:underline hidden sm:flex items-center gap-1">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...vehicleEvents, ...realEstateEvents].slice(0, 6).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>

        {/* Featured Lots */}
        <div>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Lotes em Destaque</h2>
              <p className="text-muted-foreground mt-1">Oportunidades selecionadas</p>
            </div>
            <Link href="/search" className="text-primary hover:underline hidden sm:flex items-center gap-1">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...vehicleLots, ...realEstateLots].slice(0, 8).map((lot) => (
              <BidExpertCard
                key={lot.id}
                item={lot}
                type="lot"
                platformSettings={platformSettings}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBanner() {
  const features = [
    { icon: Shield, title: 'Segurança', description: 'Plataforma certificada e dados protegidos' },
    { icon: Gavel, title: 'Transparência', description: 'Processos claros e documentados' },
    { icon: TrendingUp, title: 'Economia', description: 'Descontos de até 60% do valor de mercado' },
    { icon: Users, title: 'Suporte', description: 'Atendimento especializado 24/7' },
  ];

  return (
    <section className="py-12 md:py-16" data-testid="home-v2-trust">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Por que escolher o BidExpert?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mais de 10 anos de experiência em leilões com milhares de clientes satisfeitos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 bg-muted/30">
              <CardContent className="pt-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-12 md:py-16 bg-primary/5" data-testid="home-v2-cta">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="border-primary text-primary">
            <Award className="h-3 w-3 mr-1" />
            Cadastro Gratuito
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para encontrar sua próxima oportunidade?
          </h2>
          <p className="text-lg text-muted-foreground">
            Cadastre-se gratuitamente e tenha acesso a milhares de lotes em leilão.
            Receba alertas personalizados e acompanhe suas ofertas em tempo real.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Criar Conta Gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                Falar com Especialista
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomeV2Page() {
  const platformSettings = await getPlatformSettings();

  const transformedSettings = platformSettings ? {
    siteTitle: platformSettings.siteTitle ?? undefined,
    logoUrl: platformSettings.logoUrl ?? undefined,
  } : null;

  return (
    <div className="min-h-screen flex flex-col" data-testid="home-v2-page">
      {/* SegmentHeader removed */}

      <main className="flex-1">
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <HeroSection />
        </Suspense>

        <Suspense fallback={
          <div className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)}
            </div>
          </div>
        }>
          <SegmentCards />
        </Suspense>

        <Suspense fallback={
          <div className="container mx-auto px-4 py-16 bg-muted/30">
            <div className="grid grid-cols-3 gap-6 mb-16">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          </div>
        }>
          <FeaturedSection platformSettings={transformedSettings} />
        </Suspense>

        <TrustBanner />
        <CTASection />
      </main>

      {/* SegmentFooter removed */}
    </div>
  );
}
