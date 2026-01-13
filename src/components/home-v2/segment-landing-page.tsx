/**
 * @file Segment Landing Page Template
 * @description Server component template for segment landing pages
 * (veiculos, imoveis, maquinas, tecnologia) with all required sections.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import {
  SegmentHeader,
  SegmentHero,
  CategoryGrid,
  FeaturedEventsSection,
  LotsGridSection,
  PartnersCarousel,
  TrustSection,
  DealOfTheDay,
  SegmentFooter,
  getSegmentConfig,
  SEGMENT_ORDER,
  type SegmentType,
} from '@/components/home-v2';
import {
  getSegmentEvents,
  getSegmentLots,
  getSegmentPartners,
  getSegmentDealOfTheDay,
  getSegmentStats,
} from '@/components/home-v2/segment-data';

export const dynamic = 'force-dynamic';

interface SegmentPageProps {
  segment: SegmentType;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-[420px] w-full" />
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SegmentLandingPage({ segment }: SegmentPageProps) {
  // Validate segment
  if (!SEGMENT_ORDER.includes(segment)) {
    notFound();
  }

  const config = getSegmentConfig(segment);

  // Fetch data in parallel
  const [
    platformSettings,
    events,
    lots,
    partners,
    dealOfTheDay,
    stats,
  ] = await Promise.all([
    getPlatformSettings(),
    getSegmentEvents(segment, 12),
    getSegmentLots(segment, 12),
    getSegmentPartners(segment, 10),
    getSegmentDealOfTheDay(segment),
    getSegmentStats(segment),
  ]);

  return (
    <div className="min-h-screen flex flex-col" data-testid={`segment-page-${segment}`}>
      {/* Header */}
      <SegmentHeader 
        activeSegment={segment} 
        platformSettings={platformSettings}
      />

      <main className="flex-1">
        {/* Hero Banner */}
        <SegmentHero 
          config={config} 
          eventsCount={stats.eventsCount}
          lotsCount={stats.lotsCount}
        />

        {/* Categories */}
        <CategoryGrid
          segmentId={segment}
          categories={config.categories}
          title={`Categorias de ${config.name}`}
          subtitle="Navegue pelas categorias mais procuradas"
        />

        {/* Featured Events */}
        <FeaturedEventsSection
          segmentId={segment}
          events={events}
          title="Eventos em Destaque"
          subtitle="Os leilões mais aguardados do momento"
        />

        {/* Deal of the Day */}
        {dealOfTheDay && (
          <DealOfTheDay
            deal={dealOfTheDay}
            segmentId={segment}
            title={`Oferta do Dia - ${config.name}`}
          />
        )}

        {/* Lots Grid */}
        <LotsGridSection
          segmentId={segment}
          lots={lots}
          title={`Lotes em Destaque - ${config.name}`}
          subtitle="Oportunidades selecionadas para você"
          showFinanceableFilter={segment === 'veiculos' || segment === 'imoveis'}
          platformSettings={platformSettings}
        />

        {/* Partners Carousel */}
        <PartnersCarousel
          partners={partners}
          title={`Parceiros - ${config.name}`}
          subtitle="Conheça os comitentes e leiloeiros que confiam em nós"
        />

        {/* Trust Section */}
        <TrustSection
          segmentId={segment}
          segmentName={config.name}
          trustPoints={config.trustPoints}
        />
      </main>

      {/* Footer */}
      <SegmentFooter />
    </div>
  );
}
