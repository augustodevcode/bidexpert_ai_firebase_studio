
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Button } from '@/components/ui/button';
import { History, AlertCircle } from 'lucide-react';
import { sampleLots } from '@/lib/sample-data';
import type { Lot } from '@/types';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import LotCard from '@/components/lot-card'; // Importar o LotCard

export default function BrowsingHistoryPage() {
  const [viewedLots, setViewedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const ids = getRecentlyViewedIds();
    const lotsFromHistory = ids.map(id => sampleLots.find(lot => lot.id === id)).filter(lot => lot !== undefined) as Lot[];
    setViewedLots(lotsFromHistory);
    setIsLoading(false);
  }, []);

  if (!isClient || isLoading) {
    return (
        <div className="space-y-8">
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
            <CardContent className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                        <Card key={i} className="overflow-hidden">
                            <div className="relative aspect-[16/10] bg-muted rounded-t-lg"></div>
                            <CardContent className="p-3 flex-grow space-y-1.5">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-8 bg-muted rounded w-full mt-1"></div>
                                <div className="h-4 bg-muted rounded w-1/2 mt-1"></div>
                            </CardContent>
                            <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
                                <div className="h-6 bg-muted rounded w-1/3"></div>
                                <div className="h-4 bg-muted rounded w-1/2 mt-1"></div>
                                <div className="h-4 bg-muted rounded w-full mt-1"></div>
                                <div className="h-8 bg-muted rounded w-full mt-2"></div>
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
            <History className="h-7 w-7 mr-3 text-primary" />
            Histórico de Navegação
          </CardTitle>
          <CardDescription>
            Lotes que você visualizou recentemente. O histórico é salvo no seu navegador.
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
              {viewedLots.map((lot) => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
