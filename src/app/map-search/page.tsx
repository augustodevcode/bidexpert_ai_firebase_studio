import type { Metadata } from 'next';
import MapSearchPageClient from './_client';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Mapa de Leilões BidExpert',
  description: 'Explore lotes, vendas diretas e tomadas de preços no mapa BidExpert com filtros geolocalizados em tempo real.',
  url: 'https://bidexpert.app/map-search',
  inLanguage: 'pt-BR',
  isPartOf: {
    '@type': 'WebSite',
    name: 'BidExpert',
    url: 'https://bidexpert.app',
  },
};

export const metadata: Metadata = {
  title: 'Busca Geolocalizada de Leilões | BidExpert',
  description: 'Visualize leilões, lotes e vendas diretas no mapa em tempo real e sincronize datasets inteligentes em poucos cliques.',
  alternates: {
    canonical: 'https://bidexpert.app/map-search',
  },
  openGraph: {
    title: 'Mapa Inteligente de Leilões BidExpert',
    description: 'Filtros geográficos, datasets por modalidade e modo tela cheia para explorar oportunidades.',
    url: 'https://bidexpert.app/map-search',
    siteName: 'BidExpert',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mapa Inteligente de Leilões BidExpert',
    description: 'Filtre lotes e vendas diretas diretamente no mapa.',
  },
};

export default function MapSearchPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MapSearchPageClient />
    </>
  );
}
