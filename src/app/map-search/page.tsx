
'use client';

import { useState, useEffect } from 'react';
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

// Placeholder for a future, more robust map component
const MapComponentPlaceholder = ({ items, itemType }: { items: (Lot | Auction)[], itemType: 'lot' | 'auction' }) => {
  const itemCount = items.length;
  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-muted rounded-lg shadow-inner overflow-hidden flex items-center justify-center text-center p-4">
        <Image src="https://placehold.co/1200x800.png?text=Mapa+do+Brasil+-+Interativo" alt="Mapa do Brasil com pins" fill className="object-cover opacity-30" data-ai-hint="mapa brasil pins" />
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'lots' | 'auctions'>('lots');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapItems, setMapItems] = useState<(Lot | Auction)[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(samplePlatformSettings); // Usando sample


  useEffect(() => {
    // Simular busca inicial ou baseada em geolocalização (placeholder)
    setIsLoading(true);
    // Aqui você faria a lógica de busca inicial, talvez por geolocalização do usuário
    // ou mostrando todos os itens com localização
    const initialItems = searchType === 'lots' 
        ? sampleLots.filter(lot => lot.latitude && lot.longitude)
        : sampleAuctions.filter(auc => auc.city && auc.state); // auctions might not have lat/lng directly yet
    
    setMapItems(initialItems);
    setIsLoading(false);
  }, [searchType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // Simulação de busca
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
  
  const displayedItems = mapItems.slice(0, 6); // Limitar para não sobrecarregar a UI na demo


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold font-headline">Busca por Localização</CardTitle>
          <CardDescription>
            Encontre leilões e lotes próximos a você ou em uma região específica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative flex-grow w-full sm:w-auto">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Digite cidade, estado, CEP ou palavra-chave..."
                className="h-11 pl-10 text-md rounded-md shadow-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={searchType} onValueChange={(value) => setSearchType(value as 'lots' | 'auctions')}>
              <SelectTrigger className="h-11 w-full sm:w-[150px] rounded-md shadow-sm">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lots">Lotes</SelectItem>
                <SelectItem value="auctions">Leilões</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="h-11 w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SearchIcon className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </form>
          
           <div className="mb-6">
             <MapComponentPlaceholder items={mapItems} itemType={searchType} />
           </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Buscando...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="shadow-md">
            <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3"/>
                <p className="text-destructive font-semibold">{error}</p>
            </CardContent>
        </Card>
      )}

      {!isLoading && !error && mapItems.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Resultados Próximos (Visualização de Exemplo)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedItems.map(item => 
              searchType === 'lots' 
                ? <LotCard key={`lot-${item.id}`} lot={item as Lot} badgeVisibilityConfig={platformSettings.sectionBadgeVisibility?.searchGrid} /> 
                : <AuctionCard key={`auction-${item.id}`} auction={item as Auction} />
            )}
          </div>
          {mapItems.length > displayedItems.length && (
             <div className="text-center mt-6">
                <Button variant="outline">Ver mais resultados (Paginação Pendente)</Button>
            </div>
          )}
        </section>
      )}
       {!isLoading && !error && mapItems.length === 0 && searchTerm && (
         <Card className="shadow-md">
            <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3"/>
                <p className="text-muted-foreground">Nenhum resultado encontrado para "{searchTerm}". Tente outros termos ou ajuste os filtros.</p>
            </CardContent>
        </Card>
       )}
    </div>
  );
}

```
  </content>
  </change>
  <change>
    <file>/src/components/lot-map-preview-modal.tsx</file>
    <content><![CDATA[
'use client';

import type { Lot, PlatformSettings } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import LotMapDisplay from '@/components/auction/lot-map-display'; 

interface LotMapPreviewModalProps {
  lot: Lot | null;
  platformSettings: PlatformSettings;
  isOpen: boolean;
  onClose: () => void;
}

export default function LotMapPreviewModal({ lot, platformSettings, isOpen, onClose }: LotMapPreviewModalProps) {
  if (!isOpen || !lot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" /> Localização do Lote: {lot.title}
          </DialogTitle>
          <DialogDescription>
            {lot.mapAddress || (lot.latitude && lot.longitude ? `Coordenadas: ${lot.latitude}, ${lot.longitude}` : 'Detalhes da localização.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <LotMapDisplay lot={lot} platformSettings={platformSettings} />
        </div>

        <DialogFooter className="p-4 border-t sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    