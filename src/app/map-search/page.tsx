// src/app/map-search/page.tsx
/**
 * @fileoverview Página de busca por mapa.
 * Este componente de cliente oferece uma experiência de busca interativa onde
 * os resultados (lotes ou leilões) são exibidos tanto em uma lista quanto em
 * um mapa geográfico. O componente gerencia o estado da busca, os filtros,
 * a interação com o mapa (zoom, arrastar) e atualiza os resultados dinamicamente
 * com base na área visível do mapa.
 */
'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, AlertCircle, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { LatLngBounds } from 'leaflet';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';


const MapSearchComponent = dynamic(() => import('@/components/map-search-component'), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full rounded-lg" />,
});

function MapSearchPageContent() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [searchType, setSearchType] = useState<'lots' | 'auctions'>((searchParamsHook.get('type') as 'lots' | 'auctions') || 'lots');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(4);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [isUserInteraction, setIsUserInteraction] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mapCenter) { // Set only if not already set, to avoid overriding
            setMapCenter([position.coords.latitude, position.coords.longitude]);
            setMapZoom(13);
          }
        },
        () => {
          if (!mapCenter) {
            console.warn("Geolocation permission denied. Defaulting to center of Brazil.");
            setMapCenter([-14.235, -51.9253]);
            setMapZoom(4);
          }
        },
        { timeout: 5000 }
      );
    } else {
        if (!mapCenter) {
            console.warn("Geolocation is not supported. Defaulting to center of Brazil.");
            setMapCenter([-14.235, -51.9253]);
            setMapZoom(4);
        }
    }

    async function fetchData() {
        setIsLoading(true);
        try {
            const [settings, auctions, lots] = await Promise.all([
                getPlatformSettings(),
                getAuctions(true),
                getLots(undefined, true)
            ]);
            setPlatformSettings(settings);
            setAllAuctions(auctions);
            setAllLots(lots);
        } catch (err) {
            console.error("Failed to fetch map data", err);
            setError("Falha ao carregar dados do mapa.");
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUserInteraction(false); // Reset to fit bounds on new search
    // The filter logic will re-run automatically due to state change
  };

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setMapBounds(bounds);
    if (!isUserInteraction) {
        setIsUserInteraction(true);
    }
  }, [isUserInteraction]);
  
  const filteredItems = useMemo(() => {
    if (isLoading) return [];
    
    let baseItems = searchType === 'lots' ? allLots : allAuctions;
    
    let searchedItems = baseItems;
    const term = searchTerm.toLowerCase();
    if (term) {
         searchedItems = baseItems.filter(item => {
             const searchableText = `${item.title} ${item.description || ''} ${'city' in item ? item.city : ''} ${'state' in item ? item.state : ''} ${'cityName' in item ? item.cityName : ''} ${'stateUf' in item ? item.stateUf : ''}`;
             return searchableText.toLowerCase().includes(term);
         });
    }

    if (isUserInteraction && mapBounds) {
        return searchedItems.filter(item => {
            if (item.latitude && item.longitude) {
                return mapBounds.contains([item.latitude, item.longitude]);
            }
            return false;
        });
    }

    return searchedItems;

  }, [searchTerm, searchType, allLots, allAuctions, isLoading, mapBounds, isUserInteraction]);
  
  const displayedItems = filteredItems.slice(0, 50);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--header-height,160px)-1rem)] gap-4 md:gap-6">
        <Card className="md:w-2/5 lg:w-1/3 xl:w-1/4 flex flex-col shadow-lg h-full">
            <CardHeader className="p-4 border-b">
                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cidade, Estado, CEP ou Palavra-chave..."
                            className="h-10 pl-10 text-sm rounded-md w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={searchType} onValueChange={(value) => setSearchType(value as 'lots' | 'auctions')}>
                        <SelectTrigger className="h-9 flex-1 text-xs">
                            <SelectValue placeholder="Buscar por..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lots">Lotes</SelectItem>
                            <SelectItem value="auctions">Leilões</SelectItem>
                        </SelectContent>
                        </Select>
                        <Button type="submit" size="sm" className="h-9" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <SearchIcon className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </CardHeader>
            <ScrollArea className="flex-grow">
                <CardContent className="p-3 space-y-3">
                {isLoading && (
                    <div className="text-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
                    </div>
                )}
                {!isLoading && error && (
                    <div className="text-center py-6">
                        <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2"/>
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}
                {!isLoading && !error && platformSettings && displayedItems.length === 0 && (
                    <div className="text-center py-6">
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                        <p className="text-sm text-muted-foreground">Nenhum resultado encontrado. Tente uma busca diferente ou mova o mapa.</p>
                    </div>
                )}
                {!isLoading && !error && platformSettings && displayedItems.length > 0 && (
                    displayedItems.map(item => (
                       <Card key={item.id} className="mb-3 p-3 shadow-sm">
                            <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-md line-clamp-2">{'title' in item ? item.title : 'Item sem título'}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 text-sm text-muted-foreground">
                                <p>Tipo: {searchType === 'lots' ? 'Lote' : 'Leilão'}</p>
                                {'city' in item && item.city && <p>Local: {item.city} - {'state' in item ? item.state : ''}</p>}
                                {'initialPrice' in item && item.initialPrice && <p>Preço Inicial: {item.initialPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                                {'auctionDate' in item && item.auctionDate && <p>Data: {format(new Date(item.auctionDate as string), 'dd/MM/yyyy', { locale: ptBR })}</p>}
                            </CardContent>
                            <CardFooter className="p-0 pt-2">
                                <Link href={searchType === 'lots' ? `/lots/${item.id}` : `/auctions/${item.id}`} className="w-full">
                                    <Button variant="outline" size="sm" className="w-full">Ver Detalhes</Button>
                                </Link>
                            </CardFooter>
                       </Card>
                    ))
                )}
                </CardContent>
            </ScrollArea>
        </Card>

        <div className="flex-grow h-full md:h-auto rounded-lg overflow-hidden shadow-lg relative z-0">
             {mapCenter && <MapSearchComponent
                items={filteredItems}
                itemType={searchType}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                onBoundsChange={handleBoundsChange}
                shouldFitBounds={!isUserInteraction}
            />
            }
        </div>
    </div>
  );
}

function MapSearchFallback() {
    return (
        <div className="flex h-[calc(100vh-var(--header-height,160px)-1rem)] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    );
}

export default function MapSearchPage() {
    return (
        <Suspense fallback={<MapSearchFallback />}>
            <MapSearchPageContent />
        </Suspense>
    );
}
