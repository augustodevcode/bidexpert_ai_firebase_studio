
'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Lot, Auction } from '@/types';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect } from 'react';

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
                Início: {format(new Date(auction.auctionDate), "dd/MM/yyyy", { locale: ptBR })}
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

export default function MapSearchComponent({ items, itemType }: { items: (Lot | Auction)[]; itemType: 'lot' | 'auction'; }) {

  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const mapCenter: [number, number] = [-14.2350, -51.9253]; // Centro do Brasil
  const defaultZoom = 4;

  const validItems = items.filter(item => 'latitude' in item && 'longitude' in item && item.latitude && item.longitude);

  return (
    <MapContainer center={mapCenter} zoom={defaultZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validItems.map(item => {
        const lot = item as Lot; // Assuming all items with lat/lng are Lots for this structure
        return (
          <Marker key={item.id} position={[lot.latitude!, lot.longitude!]}>
            <Popup minWidth={192}>
              {itemType === 'lot' ? <LotPopupCard lot={item as Lot} /> : <AuctionPopupCard auction={item as Auction} />}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
