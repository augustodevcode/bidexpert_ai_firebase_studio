/**
 * /lots — Public lot listing page (V2 card grid).
 * Server component that fetches lots grouped by auction type
 * and renders them in category sections using AuctionLotCardV2.
 */
import type { Metadata } from 'next';
import { getLotsForV2Page, type GroupedLots } from '@/services/lot-card-v2.service';
import { LotsPageClient } from './lots-page-client';

export const metadata: Metadata = {
  title: 'Lotes em Leilão | BidExpert',
  description:
    'Explore lotes judiciais, extrajudiciais, venda direta e tomada de preços. Encontre oportunidades com descontos reais de mercado.',
};

export const dynamic = 'force-dynamic';

export default async function LotsPage() {
  let grouped: GroupedLots = {
    judicial: [],
    extrajudicial: [],
    vendaDireta: [],
    tomadaDePrecos: [],
  };

  try {
    grouped = await getLotsForV2Page({ limit: 80 });
  } catch (err) {
    console.error('[LotsPage] Failed to fetch lots:', err);
  }

  return <LotsPageClient grouped={grouped} />;
}
