
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, ListFilter, Layers, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Lot, Auction, PlatformSettings } from '@/types';
import LotCard from '@/components/lot-card';
import AuctionCard from '@/components/auction-card';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import dynamic from 'next/dynamic';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { LatLngBounds } from 'leaflet';

export default function MapSearchPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [searchType, setSearchType] = useState<'lots' | 'auctions'>( (searchParamsHook.get('type') as 'lots' | 'auctions') || 'lots');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [initialCenter, setInitialCenter] = useState<[number, number]>([-14.235, -51.9253]); // Brazil center
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [isUserInteraction, setIsUserInteraction] = useState(false); // Flag to check if map was moved by user

  const MapSearchComponent = useMemo(() => dynamic(() => import('@/components/map-search-component'), {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    ),
  }), []);

  useEffect(() => {
    // Get user's current location to center map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setInitialCenter([position.coords.latitude, position.coords.longitude]);
            },
            () => {
                console.warn("Geolocation permission denied. Defaulting to center of Brazil.");
            }
        );
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
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUserInteraction(false); // Reset interaction flag to allow map to fit new bounds
    setMapBounds(null); // Clear bounds to trigger re-fit
    // Filtering will happen automatically in useMemo
  };

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setMapBounds(bounds);
    setIsUserInteraction(true); // User moved the map
  }, []);
  
  const filteredItems = useMemo(() => {
    if (isLoading) return [];
    
    const baseItems = searchType === 'lots' ? allLots : allAuctions;
    
    let results = baseItems.filter(item => {
        // Search term filter
        const term = searchTerm.toLowerCase();
        if (term) {
             const searchableText = `${item.title} ${item.description || ''} ${'city' in item ? item.city : ''} ${'state' in item ? item.state : ''} ${'cityName' in item ? item.cityName : ''} ${'stateUf' in item ? item.stateUf : ''}`;
             if (!searchableText.toLowerCase().includes(term)) {
                 return false;
             }
        }

        // Map bounds filter (only if user has interacted with map)
        if (isUserInteraction && mapBounds) {
            if ('latitude' in item && 'longitude' in item && item.latitude && item.longitude) {
                if (!mapBounds.contains([item.latitude, item.longitude])) {
                    return false;
                }
            } else {
                return false; // Don't show items without coordinates when filtering by map
            }
        }

        return true;
    });

    return results;

  }, [searchTerm, searchType, allLots, allAuctions, isLoading, mapBounds, isUserInteraction]);
  
  const displayedItems = filteredItems.slice(0, 50); // Limit list display to 50 items

  if (!platformSettings) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
                {!isLoading && !error && displayedItems.length > 0 && (
                    displayedItems.map(item => 
                    searchType === 'lots' 
                        ? <LotCard key={`lot-${item.id}`} lot={item as Lot} platformSettings={platformSettings} /> 
                        : <AuctionCard key={`auction-${item.id}`} auction={item as Auction} />
                    )
                )}
                </CardContent>
            </ScrollArea>
        </Card>

        <div className="flex-grow h-full md:h-auto rounded-lg overflow-hidden shadow-lg">
             <MapSearchComponent
                items={filteredItems}
                itemType={searchType}
                initialCenter={initialCenter}
                onBoundsChange={handleBoundsChange}
                shouldFitBounds={!isUserInteraction}
             />
        </div>
    </div>
  );
}
