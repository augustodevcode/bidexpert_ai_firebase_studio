// src/app/direct-sales/[offerId]/page.tsx
/**
 * @fileoverview Página de servidor para renderização inicial dos detalhes de uma Oferta de Venda Direta.
 * Este componente busca os dados da oferta no servidor e os passa para o componente
 * de cliente `OfferDetailClient`, que lida com a renderização interativa.
 */
import OfferDetailClient from './offer-detail-client';
import { getDirectSaleOffer } from '../actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default async function DirectSaleOfferDetailPage({ params }: { params: { offerId: string } }) {
  const offerId = params.offerId;
  const offer = await getDirectSaleOffer(offerId);

  if (!offer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Oferta Não Encontrada</h1>
        <p className="text-muted-foreground">A oferta que você está procurando (ID: {offerId}) não existe.</p>
        <Button asChild className="mt-4">
          <Link href="/direct-sales">Voltar para Venda Direta</Link>
        </Button>
      </div>
    );
  }

  return <OfferDetailClient offer={offer} />;
}
