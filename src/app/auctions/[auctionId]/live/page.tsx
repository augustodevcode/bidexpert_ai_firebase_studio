// src/app/auctions/[auctionId]/live/page.tsx
/**
 * @fileoverview Redirecionamento de compatibilidade: /live → /monitor (V2).
 * Esta página existia como Auditório Virtual V1. Agora redireciona
 * automaticamente para o Monitor V2, preservando parâmetros de query (lotId).
 */
'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LiveAuctionRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const auctionId = typeof params.auctionId === 'string' ? params.auctionId : '';

  useEffect(() => {
    if (!auctionId) return;

    const lotId = searchParams.get('lotId');
    const monitorUrl = `/auctions/${auctionId}/monitor${lotId ? `?lotId=${lotId}` : ''}`;

    console.log(`[LiveRedirect] Redirecting /live → ${monitorUrl}`);
    router.replace(monitorUrl);
  }, [auctionId, searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" data-ai-id="live-redirect-page">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
      <h1 className="text-2xl font-semibold text-foreground mb-2">Redirecionando...</h1>
      <p className="text-muted-foreground">Encaminhando para o Monitor V2 do pregão.</p>
    </div>
  );
}
