
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { getLots } from '@/app/admin/lots/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import type { Lot, PlatformSettings, Auction } from '@/types';
import { getRecentlyViewedIds, removeRecentlyViewedId } from '@/lib/recently-viewed-store';
import LotCard from '@/components/lot-card';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { useToast } from '@/hooks/use-toast';

export default function BrowsingHistoryPage() {
  const [viewedLots, setViewedLots] = useState<Lot[]>([]);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const { toast } = useToast();

  const loadHistory = async () => {
      setIsLoading(true);
      const [settings, auctions, allLotsData] = await Promise.all([
        getPlatformSettings(),
        getAuctions(),
        getLots(),
      ]);
      
      setPlatformSettings(settings);
      setAllAuctions(auctions);

      const ids = getRecentlyViewedIds();
      const lotsFromHistory = ids.map(id => allLotsData.find(lot => lot.id === id)).filter(lot => lot !== undefined) as Lot[];
      setViewedLots(lotsFromHistory);
      setIsLoading(false);
  };
  
  useEffect(() => {
    loadHistory();
  }, []);

  const handleRemoveFromHistory = (lotId: string, lotTitle: string) => {
    removeRecentlyViewedId(lotId);
    setViewedLots(prev => prev.filter(lot => lot.id !== lotId));
    toast({
      title: "Item Removido",
      description: `O lote "${lotTitle}" foi removido do seu histórico.`
    });
  };

  if (isLoading || !platformSettings) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Carregando histórico...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <History className="h-7 w-7 mr-3 text-primary" />
            Histórico de Navegação
          </CardTitle>
          <CardDescription>
            Lotes que você visualizou recentemente. O histórico é salvo no seu navegador e expira em 3 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewedLots.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Item no Histórico</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Quando você visualizar lotes, eles aparecerão aqui.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/search">Buscar Lotes</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewedLots.map((lot) => {
                const parentAuction = allAuctions.find(a => a.id === lot.auctionId);
                return (
                  <div key={lot.id} className="relative group/history">
                    <LotCard lot={lot} auction={parentAuction} platformSettings={platformSettings} />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-3 right-3 h-7 w-7 rounded-full opacity-0 group-hover/history:opacity-100 transition-opacity z-20"
                      onClick={() => handleRemoveFromHistory(lot.id, lot.title)}
                      aria-label="Remover do Histórico"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
