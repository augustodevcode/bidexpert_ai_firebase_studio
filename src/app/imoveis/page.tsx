/**
 * @file Imóveis Segment Landing Page
 * @description Landing page for the real estate auction segment
 * including residential, commercial, and land properties.
 */

import { Metadata } from 'next';
import SegmentLandingPage from '@/components/home-v2/segment-landing-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leilões de Imóveis | BidExpert',
  description: 'Leilões de imóveis judiciais e corporativos com transparência jurídica completa. Casas, apartamentos, terrenos e imóveis comerciais.',
  keywords: ['leilão de imóveis', 'imóveis judiciais', 'apartamentos leilão', 'casas leilão', 'terrenos leilão'],
  openGraph: {
    title: 'Leilões de Imóveis | BidExpert',
    description: 'Leilões de imóveis com transparência jurídica completa e suporte especializado.',
    type: 'website',
  },
};

export default function ImoveisPage() {
  return <SegmentLandingPage segment="imoveis" />;
}
