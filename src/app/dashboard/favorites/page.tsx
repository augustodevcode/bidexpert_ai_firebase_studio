
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, XCircle, AlertCircle } from 'lucide-react';
import { sampleLots, getLotStatusColor, getAuctionStatusText } from '@/lib/sample-data';
import type { Lot } from '@/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFavoriteLotIdsFromStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store'; // Nova importação

export default function FavoriteLotsPage() {
  const [favoriteLots, setFavoriteLots] = useState<Lot[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const favoriteIds = getFavoriteLotIdsFromStorage();
    const currentlyFavoriteLots = sampleLots.filter(lot => favoriteIds.includes(lot.id));
    setFavoriteLots(currentlyFavoriteLots);
  }, []);

  const handleRemoveFavorite = (lotId: string) => {
    const lotToRemove = favoriteLots.find(lot => lot.id === lotId);
    
    removeFavoriteLotIdFromStorage(lotId); // Remove do localStorage
    setFavoriteLots(prev => prev.filter(lot => lot.id !== lotId)); // Atualiza UI

    // Opcional: se ainda quisermos modificar sampleLots em memória para consistência na sessão atual (sem refresh)
    // const lotInSampleData = sampleLots.find(l => l.id === lotId);
    // if (lotInSampleData) {
    //   lotInSampleData.isFavorite = false; 
    // }
    
    toast({
      title: "Removido dos Favoritos",
      description: `O lote "${lotToRemove?.title || 'Selecionado'}" foi removido da sua lista.`,
    });
  };

  if (!isClient) {
    return (
        <div className="space-y-8">
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
            <CardContent className="animate-pulse">
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
    <div className="space-y-8">
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
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Lote Favorito</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Marque lotes como favoritos para encontrá-los facilmente aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteLots.map((lot) => (
                <Card key={lot.id} className="overflow-hidden shadow-md flex flex-col">
                  <div className="relative aspect-[16/10]">
                    <Image 
                        src={lot.imageUrl || 'https://placehold.co/600x400.png'} 
                        alt={lot.title} 
                        fill 
                        className="object-cover"
                        data-ai-hint={lot.dataAiHint || 'imagem lote favorito'}
                    />
                     <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                  </div>
                  <CardContent className="p-4 flex-grow">
                    <h4 className="font-semibold text-md mb-1 truncate hover:text-primary">
                        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                            {lot.title}
                        </Link>
                    </h4>
                    <p className="text-xs text-muted-foreground mb-0.5">Leilão: {lot.auctionName}</p>
                    <p className="text-xs text-muted-foreground">Local: {lot.location}</p>
                    <p className="text-sm text-muted-foreground mt-1.5">
                        {lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE' ? 'Lance Inicial:' : 'Valor:'}
                        <span className="text-primary font-bold ml-1 text-md">
                            R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 border-t flex flex-col sm:flex-row gap-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Lote
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:border-red-500 flex-1" 
                      onClick={() => handleRemoveFavorite(lot.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Remover
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
