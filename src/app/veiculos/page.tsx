/**
 * @file Veículos Segment Landing Page
 * @description Landing page for the vehicles auction segment
 * including cars, motorcycles, trucks, and heavy vehicles.
 */

import { Metadata } from 'next';
import SegmentLandingPage from '@/components/home-v2/segment-landing-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leilões de Veículos | BidExpert',
  description: 'Leilões de carros, motos, caminhões e veículos pesados com descontos de até 50% abaixo da FIPE. Laudos completos e financiamento facilitado.',
  keywords: ['leilão de carros', 'leilão de veículos', 'carros de leilão', 'motos leilão', 'caminhões leilão'],
  openGraph: {
    title: 'Leilões de Veículos | BidExpert',
    description: 'Leilões de carros, motos, caminhões e veículos pesados com descontos exclusivos.',
    type: 'website',
  },
};

export default function VeiculosPage() {
  return <SegmentLandingPage segment="veiculos" />;
}
