// src/app/dashboard/favorites/page.tsx
/**
 * @fileoverview Página "Meus Favoritos" do Painel do Usuário.
 * Este componente de cliente gerencia a exibição dos lotes que o usuário
 * marcou como favoritos. Ele lê os IDs dos lotes do `localStorage`, busca os
 * dados completos desses lotes no servidor, e permite ao usuário remover
 * itens de sua lista de favoritos, atualizando tanto a UI quanto o `localStorage`.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getLotStatusColor, getAuctionStatusText } from '@/lib/ui-helpers';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFavoriteLotIdsFromStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store'; 
import { getLotsByIds } from '@/app/admin/lots/actions';
import { getAuctionsByIds } from '@/app/admin/auctions/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import UniversalCard from '@/components/universal-card';


export default function FavoriteLotsPage() {
  const [favoriteLots, setFavoriteLots] = useState<Lot[]>([]);
  const [auctionsMap, setAuctionsMap] = useState<Map<string, Auction>>(new Map());
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    const settings = await getPlatformSettings();
    if(settings) setPlatformSettings(settings as PlatformSettings);

    const favoriteIds = getFavoriteLotIdsFromStorage();
    if (favoriteIds.length > 0) {
      const favoritedLotsData = await getLotsByIds(favoriteIds);
      setFavoriteLots(favoritedLotsData);
      
      const auctionIds = Array.from(new Set(favoritedLotsData.map(lot => lot.auctionId)));
      if (auctionIds.length > 0) {
        const auctionsData = await getAuctionsByIds(auctionIds);
        setAuctionsMap(new Map(auctionsData.map(a => [a.id, a])));
      }

    } else {
      setFavoriteLots([]);
      setAuctionsMap(new Map());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveFavorite = (lotId: string) => {
    const lotToRemove = favoriteLots.find(lot => lot.id === lotId);
    
    removeFavoriteLotIdFromStorage(lotId); // Remove do localStorage
    setFavoriteLots(prev => prev.filter(lot => lot.id !== lotId)); // Atualiza UI
    
    toast({
      title: "Removido dos Favoritos",
      description: `O lote "${lotToRemove?.title || 'Selecionado'}" foi removido da sua lista.`,
    });
  };

  if (isLoading || !platformSettings) {
    return (
        <div className="space-y-8" data-ai-id="my-favorites-page-container">
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Heart className="h-7 w-7 mr-3 text-primary" />
                Meus Lotes Favoritos
            </CardTitle>
            <CardDescription>
                Acompanhe os lotes que você marcou como favoritos.
            </CardDescription>
            </CardHeader>
            <CardContent className="animate-pulse" data-ai-id="my-favorites-loading-state">
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
    <div className="space-y-8" data-ai-id="my-favorites-page-container">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Heart className="h-7 w-7 mr-3 text-primary" />
            Meus Lotes Favoritos
          </CardTitle>
          <CardDescription>
            Acompanhe os lotes que você marcou como favoritos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favoriteLots.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg" data-ai-id="my-favorites-empty-state">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Lote Favorito</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Marque lotes como favoritos para encontrá-los facilmente aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-ai-id="my-favorites-grid">
              {favoriteLots.map((lot) => {
                const parentAuction = auctionsMap.get(lot.auctionId);
                return (
                  <div key={lot.id} className="relative group/fav">
                      <UniversalCard 
                          item={lot} 
                          type="lot"
                          auction={parentAuction}
                          platformSettings={platformSettings!} 
                      />
                       <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-3 right-3 h-7 w-7 rounded-full opacity-0 group-hover/fav:opacity-100 transition-opacity z-20"
                        onClick={() => handleRemoveFavorite(lot.id)}
                        aria-label="Remover dos Favoritos"
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
