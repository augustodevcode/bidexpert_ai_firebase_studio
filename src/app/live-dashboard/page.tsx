/**
 * @file Live Dashboard Page
 * @description Real-time auction monitoring dashboard showing open lots.
 * Uses dynamic rendering to fetch fresh data on each request.
 */

import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import type { Auction, Lot } from '@/types';
import LiveLotCard from '@/components/live-lot-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, AlertCircle } from 'lucide-react';
import { isPast } from 'date-fns';

// Force dynamic rendering - this page needs real-time DB data
export const dynamic = 'force-dynamic';

async function getLiveDashboardData(): Promise<{ allOpenLots: Lot[] }> {
  const [allAuctions, allLots] = await Promise.all([
    getAuctions(true),
    getLots(undefined, true)
  ]);

  const openAuctions = allAuctions.filter(a => a.status === 'ABERTO_PARA_LANCES' || a.status === 'ABERTO');
  const openAuctionIds = new Set(openAuctions.map(a => a.id));

  let allOpenLots: Lot[] = [];

  allLots.forEach(lot => {
    if (openAuctionIds.has(lot.auctionId) && lot.status === 'ABERTO_PARA_LANCES' && lot.endDate && !isPast(new Date(lot.endDate))) {
      const parentAuction = openAuctions.find(a => a.id === lot.auctionId);
      allOpenLots.push({ ...lot, auctionName: parentAuction?.title || lot.auctionName });
    }
  });

  // Ordenar globalmente pelo horário de encerramento mais próximo
  allOpenLots.sort((a, b) => new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime());

  return { allOpenLots };
}

export default async function LiveDashboardPage() {
  const { allOpenLots } = await getLiveDashboardData();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
            <Tv className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold font-headline">Painel de Leilões Ao Vivo</CardTitle>
          <CardDescription>
            Acompanhe os lotes abertos para lance em tempo real. O lote mais próximo de encerrar está em destaque.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allOpenLots.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Lote Aberto para Lances</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Não há lotes disponíveis para lances no momento. Volte mais tarde!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {allOpenLots.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4 text-center text-primary animate-pulse">
                    PRÓXIMO LOTE A ENCERRAR!
                  </h2>
                  <div className="max-w-md mx-auto">
                    <LiveLotCard lot={allOpenLots[0]} isHighlighted={true} />
                  </div>
                </section>
              )}

              {allOpenLots.length > 1 && (
                <section>
                  <h2 className="text-xl font-semibold my-6 text-center border-t pt-6">
                    Outros Lotes Ativos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allOpenLots.slice(1).map((lot) => (
                      <LiveLotCard key={lot.id} lot={lot} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
