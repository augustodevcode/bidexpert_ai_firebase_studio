/**
 * @file Máquinas Segment Landing Page
 * @description Landing page for the machinery and equipment auction segment
 * including agricultural, industrial, and construction equipment.
 */

import { Metadata } from 'next';
import SegmentLandingPage from '@/components/home-v2/segment-landing-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leilões de Máquinas e Equipamentos | BidExpert',
  description: 'Leilões de máquinas agrícolas, industriais, equipamentos de construção e logística. Laudos técnicos e procedência garantida.',
  keywords: ['leilão de máquinas', 'tratores leilão', 'equipamentos industriais', 'escavadeiras leilão', 'empilhadeiras leilão'],
  openGraph: {
    title: 'Leilões de Máquinas e Equipamentos | BidExpert',
    description: 'Máquinas e equipamentos com laudos técnicos e procedência garantida.',
    type: 'website',
  },
};

export default function MaquinasPage() {
  return <SegmentLandingPage segment="maquinas" />;
}
