
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Loader2, AlertCircle, ListFilter, Layers, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sampleLots, sampleAuctions, samplePlatformSettings } from '@/lib/sample-data';
import type { Lot, Auction, PlatformSettings } from '@/types';
import LotCard from '@/components/lot-card';
import AuctionCard from '@/components/auction-card';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { ScrollArea } from '@/components/ui/scroll-area'; 

// Placeholder for a future, more robust map component
const MapComponentPlaceholder = ({ items, itemType }: { items: (Lot | Auction)[], itemType: 'lot' | 'auction' }) => {
  const itemCount = items.length;
  return (
    <div className="relative w-full h-full bg-muted rounded-lg shadow-inner overflow-hidden flex items-center justify-center text-center p-4">
        <Image src="https://placehold.co/1200x800.png?text=Mapa+Interativo+do+Brasil" alt="Mapa do Brasil com pins" fill className="object-cover opacity-30" data-ai-hint="mapa brasil pins" />
        <div className="z-10">
            <MapPin className="h-16 w-16 text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-foreground">Visualização de Mapa Interativa</h3>
            <p className="text-muted-foreground">
                {itemCount > 0 ? `Exibindo ${itemCount} ${itemType === 'lot' ? 'lote(s)' : 'leilão(ões)'} no mapa.` : 'Nenhum item para exibir no mapa com os filtros atuais.'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">(Componente de mapa real a ser implementado aqui)</p>
        </div>
    </div>
  );
};

export default function MapSearchPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [searchType, setSearchType] = useState<'lots' | 'auctions'>( (searchParamsHook.get('type') as 'lots' | 'auctions') || 'lots');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapItems, setMapItems] = useState<(Lot | Auction)[]>([]);
  
  const platformSettings: PlatformSettings = samplePlatformSettings; 

  useEffect(() => {
    setIsLoading(true);
    // Simular pedido de localização ao usuário (navigator.geolocation)
    // Por enquanto, vamos apenas carregar os itens iniciais
    setTimeout(() => {
        const initialItems = searchType === 'lots'
            ? sampleLots.filter(lot => lot.latitude && lot.longitude)
            : sampleAuctions.filter(auc => auc.city && auc.state); 
        setMapItems(initialItems);
        setIsLoading(false);
    }, 500);
  }, [searchType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      let results: (Lot | Auction)[] = [];
      const term = searchTerm.toLowerCase();
      if (searchType === 'lots') {
        results = sampleLots.filter(lot => 
            (lot.title.toLowerCase().includes(term) || 
             (lot.description && lot.description.toLowerCase().includes(term)) ||
             (lot.city && lot.city.toLowerCase().includes(term)) ||
             (lot.stateUf && lot.stateUf.toLowerCase().includes(term))
            ) && lot.latitude && lot.longitude
        );
      } else {
        results = sampleAuctions.filter(auc => 
            (auc.title.toLowerCase().includes(term) ||
             (auc.description && auc.description.toLowerCase().includes(term)) ||
             (auc.city && auc.city.toLowerCase().includes(term)) ||
             (auc.state && auc.state.toLowerCase().includes(term))
            )
        );
      }
      setMapItems(results);
      setIsLoading(false);
      if (results.length === 0) {
        setError("Nenhum resultado encontrado para sua busca.");
      }
    }, 700);
  };
  
  const displayedItems = mapItems.slice(0, 20); // Limitar a exibição na lista

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--header-height,160px)-1rem)] gap-4 md:gap-6">
        {/* Coluna da Esquerda: Filtros e Lista de Resultados */}
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
                {isLoading && !error && mapItems.length === 0 && (
                    <div className="text-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
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
                        ? <LotCard key={`lot-${item.id}`} lot={item as Lot} platformSettings={platformSettings} badgeVisibilityConfig={platformSettings.sectionBadgeVisibility?.searchGrid}/> 
                        : <AuctionCard key={`auction-${item.id}`} auction={item as Auction} />
                    )
                )}
                </CardContent>
            </ScrollArea>
        </Card>

        {/* Coluna da Direita: Mapa */}
        <div className="flex-grow h-full md:h-auto">
             <MapComponentPlaceholder items={mapItems} itemType={searchType} />
        </div>
    </div>
  );
}
