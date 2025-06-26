
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, AlertCircle, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Lot, Auction, PlatformSettings } from '@/types';
import LotCard from '@/components/lot-card';
import AuctionCard from '@/components/auction-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { LatLngBounds } from 'leaflet';
import dynamic from 'next/dynamic';

export default function MapSearchPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const MapSearchComponent = useMemo(() => dynamic(() => import('@/components/map-search-component'), {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando Mapa...</p>
      </div>
    ),
  }), []);

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
                getAuctions(),
                getLots()
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
                {!isLoading && !error && displayedItems.length === 0 && (
                    <div className="text-center py-6">
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                        <p className="text-sm text-muted-foreground">Nenhum resultado encontrado. Tente uma busca diferente ou mova o mapa.</p>
                    </div>
                )}
                {!isLoading && !error && platformSettings && displayedItems.length > 0 && (
                    displayedItems.map(item => 
                    searchType === 'lots' 
                        ? <LotCard key={`lot-${item.id}`} lot={item as Lot} platformSettings={platformSettings} auction={allAuctions.find(a => a.id === (item as Lot).auctionId)} /> 
                        : <AuctionCard key={`auction-${item.id}`} auction={item as Auction} />
                    )
                )}
                </CardContent>
            </ScrollArea>
        </Card>

        <div className="flex-grow h-full md:h-auto rounded-lg overflow-hidden shadow-lg relative z-0">
             {mapCenter ? (
                <MapSearchComponent
                    items={filteredItems}
                    itemType={searchType}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                    onBoundsChange={handleBoundsChange}
                    shouldFitBounds={!isUserInteraction}
                />
            ) : (
                <div className="relative w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Obtendo localização...</p>
                </div>
            )}
        </div>
    </div>
  );
}
