
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Lot, Auction } from '@/types';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function LotPopupCard({ lot }: { lot: Lot }) {
  return (
    <div className="w-48">
      <div className="relative aspect-video">
        <Image 
          src={lot.imageUrl || 'https://placehold.co/200x150.png'} 
          alt={lot.title} 
          fill 
          className="object-cover rounded-t-md"
          data-ai-hint={lot.dataAiHint || 'imagem lote mapa'}
        />
      </div>
      <div className="p-2">
        <h4 className="font-bold text-sm truncate" title={lot.title}>{lot.title}</h4>
        <p className="text-primary font-bold text-md">
          R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <Button asChild size="sm" className="w-full mt-2 h-8 text-xs">
          <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>Ver Lote</Link>
        </Button>
      </div>
    </div>
  );
}

function AuctionPopupCard({ auction }: { auction: Auction }) {
    return (
        <div className="w-48 p-2">
             <h4 className="font-bold text-sm truncate" title={auction.title}>{auction.title}</h4>
             <p className="text-xs text-muted-foreground">
                Início: {format(new Date(auction.auctionDate as Date), "dd/MM/yyyy", { locale: ptBR })}
             </p>
             <p className="text-primary font-bold text-md">
                {auction.totalLots || 0} Lotes
            </p>
            <Button asChild size="sm" className="w-full mt-2 h-8 text-xs">
                <Link href={`/auctions/${auction.publicId || auction.id}`}>Ver Leilão</Link>
            </Button>
        </div>
    );
}

export default function MapSearchComponent({ items, itemType }: { items: (Lot | Auction)[]; itemType: 'lots' | 'auctions'; }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // This runs only on the client, after the component has mounted.
    // It prevents server-side rendering issues and fixes icon paths for webpack.
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default.src,
        iconUrl: require('leaflet/dist/images/marker-icon.png').default.src,
        shadowUrl: require('leaflet/dist/images/marker-shadow.png').default.src,
    });
  }, []);

  const mapCenter: [number, number] = [-14.2350, -51.9253]; // Brazil's center
  const defaultZoom = 4;

  const validItems = useMemo(() => {
    return items.filter(item => 'latitude' in item && 'longitude' in item && item.latitude && item.longitude);
  }, [items]);
  
  if (!isClient) {
    return (
        <div className="relative w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-2 text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
    );
  }
  
  return (
    <MapContainer 
      center={mapCenter} 
      zoom={defaultZoom} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validItems.map(item => {
        // All items with lat/lng will be treated as Lot-like for positioning
        const lot = item as Lot; 
        return (
          <Marker key={item.id} position={[lot.latitude!, lot.longitude!]}>
            <Popup minWidth={192}>
              {itemType === 'lots' ? <LotPopupCard lot={item as Lot} /> : <AuctionPopupCard auction={item as Auction} />}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
