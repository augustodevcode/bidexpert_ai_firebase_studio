/**
 * @file Tecnologia Segment Landing Page
 * @description Landing page for the technology auction segment
 * including IT equipment, electronics, and corporate assets.
 */

import { Metadata } from 'next';
import SegmentLandingPage from '@/components/home-v2/segment-landing-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leilões de Tecnologia e Eletrônicos | BidExpert',
  description: 'Leilões de equipamentos de TI, eletrônicos e ativos corporativos. Notebooks, servidores, smartphones e muito mais.',
  keywords: ['leilão de eletrônicos', 'computadores leilão', 'notebooks leilão', 'celulares leilão', 'servidores leilão'],
  openGraph: {
    title: 'Leilões de Tecnologia e Eletrônicos | BidExpert',
    description: 'Equipamentos de TI e eletrônicos com garantia de procedência.',
    type: 'website',
  },
};

export default function TecnologiaPage() {
  return <SegmentLandingPage segment="tecnologia" />;
}
