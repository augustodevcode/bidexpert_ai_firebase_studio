// src/app/dashboard/history/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Eye, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getRecentlyViewedIds, removeRecentlyViewedId } from '@/lib/recently-viewed-store'; 
import { getLotsByIds } from '@/app/admin/lots/actions';
import { getAuctionsByIds } from '@/app/admin/auctions/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import UniversalCard from '@/components/universal-card';


export default function BrowsingHistoryPage() {
  const [viewedLots, setViewedLots] = useState<Lot[]>([]);
  const [auctionsMap, setAuctionsMap] = useState<Map<string, Auction>>(new Map());
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const settings = await getPlatformSettings();
    if (settings) {
      setPlatformSettings(settings as PlatformSettings);
    }


    const viewedIds = getRecentlyViewedIds();
    if (viewedIds.length > 0) {
      const favoritedLotsData = await getLotsByIds(viewedIds);
      
      const sortedViewedLots = viewedIds
        .map(id => favoritedLotsData.find(lot => lot.id === id))
        .filter((lot): lot is Lot => !!lot);
        
      setViewedLots(sortedViewedLots);
      
      const auctionIds = Array.from(new Set(favoritedLotsData.map(lot => lot.auctionId)));
      if (auctionIds.length > 0) {
        const auctionsData = await getAuctionsByIds(auctionIds);
        setAuctionsMap(new Map(auctionsData.map(a => [a.id, a])));
      }

    } else {
      setViewedLots([]);
      setAuctionsMap(new Map());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
        <div className="space-y-8" data-ai-id="my-favorites-page-container">
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <History className="h-7 w-7 mr-3 text-primary" />
                Histórico de Navegação
            </CardTitle>
            <CardDescription>
                Lotes que você visualizou recentemente.
            </CardDescription>
            </CardHeader>
            <CardContent className="animate-pulse" data-ai-id="my-history-loading-state">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                        <Card key={i} className="overflow-hidden">
                            <div className="relative aspect-video bg-muted rounded-t-lg"></div>
                            <CardContent className="p-4 space-y-2">
                                <div className="h-5 bg-muted rounded w-3/4"></div>
                                <div className="h-4 bg-muted rounded w-1/2"></div>
                                <div className="h-4 bg-muted rounded w-1/3"></div>
                            </CardContent>
                            <CardFooter className="p-4 border-t flex gap-2">
                                <div className="h-9 bg-muted rounded w-1/2"></div>
                                <div className="h-9 bg-muted rounded w-1/2"></div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
        </div>
    );
  }


  return (
    <div className="space-y-8" data-ai-id="browsing-history-page-container">
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
            <div className="text-center py-12 bg-secondary/30 rounded-lg" data-ai-id="browsing-history-empty-state">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-ai-id="browsing-history-grid">
              {viewedLots.map((lot) => {
                const parentAuction = auctionsMap.get(lot.auctionId);
                return (
                  <div key={lot.id} className="relative group/history">
                    <UniversalCard 
                      item={lot} 
                      type="lot"
                      auction={parentAuction}
                      platformSettings={platformSettings} 
                      onUpdate={loadHistory}
                    />
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
