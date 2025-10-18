// src/app/lots/[lotId]/page.tsx
/**
 * @fileoverview Página de redirecionamento para detalhes de um lote.
 * Este componente Server-Side captura requisições para a rota `/lots/[lotId]`
 * e as redireciona permanentemente para a URL canônica `/auctions/[auctionId]/lots/[lotId]`.
 * Isso é crucial para SEO e para manter uma estrutura de URL consistente,
 * evitando conteúdo duplicado e garantindo que o usuário sempre veja o lote
 * no contexto do seu leilão.
 */
import { notFound, redirect } from 'next/navigation';
import { getLot, getLots } from '@/app/admin/lots/actions';
import { Loader2 } from 'lucide-react';

export default async function LotRedirectPage({ params }: { params: { lotId: string } }) {
  const lotId = params.lotId;

  if (!lotId) {
    notFound();
  }

  // Fetch the lot using the provided ID (could be publicId or internal ID)
  const lot = await getLot(lotId, true); // Use public call for this redirect logic

  if (lot && lot.auctionId) {
    // If lot is found, redirect to its canonical URL
    const canonicalUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
    console.log(`[LotRedirectPage] Lot ${lotId} found. Redirecting to: ${canonicalUrl}`);
    redirect(canonicalUrl);
  } else {
    // If lot is not found, render the notFound UI
    console.warn(`[LotRedirectPage] Lot with ID ${lotId} not found.`);
    notFound();
  }
  
  // This part is technically unreachable due to redirect/notFound, but good practice.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecionando para o lote...</p>
    </div>
  );
}
