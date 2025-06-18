
'use client';

import type { Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Info, ExternalLink } from 'lucide-react';

interface LotMapDisplayProps {
  lot: Lot;
  platformSettings: PlatformSettings;
}

export default function LotMapDisplay({ lot, platformSettings }: LotMapDisplayProps) {
  const { mapSettings } = platformSettings;
  const { latitude, longitude, mapEmbedUrl, mapStaticImageUrl, mapAddress, title } = lot;

  const displayTitle = mapAddress || (latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : "Localização do Lote");

  let mapContent = null;
  let externalMapLink: string | null = null;
  let mapProviderUsed: string = 'Nenhum';

  // 1. Priorizar mapEmbedUrl se existir
  if (mapEmbedUrl) {
    mapContent = (
      <iframe
        src={mapEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Mapa para ${title}`}
      ></iframe>
    );
    externalMapLink = mapEmbedUrl; // Assumindo que o embed URL também é um link visualizável
    mapProviderUsed = mapEmbedUrl.includes("google.com/maps/embed") ? 'Google Maps (Embed)' : 'Embed Personalizado';
  } 
  // 2. Se não tiver embed, usar o defaultProvider e API Key
  else if (mapSettings?.defaultProvider === 'google' && mapSettings?.googleMapsApiKey && (latitude && longitude || mapAddress)) {
    const query = latitude && longitude ? `${latitude},${longitude}` : encodeURIComponent(mapAddress || '');
    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${mapSettings.googleMapsApiKey}&q=${query}&zoom=${mapSettings.staticImageMapZoom || 15}`;
    mapContent = (
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Mapa Google para ${title}`}
      ></iframe>
    );
    externalMapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
    mapProviderUsed = 'Google Maps API (Embed)';
  } 
  else if (mapSettings?.defaultProvider === 'openstreetmap' && (latitude && longitude || mapAddress)) {
    const bboxDelta = 0.01; // Ajuste para o zoom do bbox
    let embedUrl = '';
    if (latitude && longitude) {
        embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - bboxDelta},${latitude - bboxDelta},${longitude + bboxDelta},${latitude + bboxDelta}&layer=mapnik&marker=${latitude},${longitude}`;
        externalMapLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
    } else if (mapAddress) {
        // OpenStreetMap embed por endereço é mais complexo, geralmente requer geocoding antes.
        // Para simplificar, vamos apenas mostrar um link de busca.
        externalMapLink = `https://www.openstreetmap.org/search?query=${encodeURIComponent(mapAddress)}`;
        mapContent = (
             <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground p-4">
                <MapPin className="h-12 w-12 mb-2" />
                <p>Pré-visualização de mapa por endereço via OpenStreetMap não disponível diretamente.</p>
                <a href={externalMapLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2">
                    Buscar no OpenStreetMap
                </a>
            </div>
        );
    }
    if (embedUrl && !mapContent) { // Apenas se tivermos lat/lon para embed
        mapContent = (
        <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            title={`Mapa OpenStreetMap para ${title}`}
        ></iframe>
        );
    }
    mapProviderUsed = 'OpenStreetMap';
  }
  // 3. Fallback para imagem estática se configurada
  else if (mapSettings?.defaultProvider === 'staticImage' && mapStaticImageUrl) {
    mapContent = (
        <Image
          src={mapStaticImageUrl}
          alt={`Mapa estático para ${title}`}
          fill
          className="object-cover"
          data-ai-hint="mapa localizacao estatico"
        />
    );
     if (latitude && longitude) externalMapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
     else if (mapAddress) externalMapLink = `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}`;
     mapProviderUsed = 'Imagem Estática (Configurada)';
  }
  // 4. Fallback para placeholder com coordenadas se nenhuma outra opção
  else if (latitude && longitude) {
    const zoom = mapSettings?.staticImageMapZoom || 15;
    const markerColor = mapSettings?.staticImageMapMarkerColor || 'blue';
    const staticMapUrl = `https://placehold.co/600x400.png?text=Mapa+(${latitude.toFixed(2)},${longitude.toFixed(2)})&font=roboto`;
    mapContent = (
        <Image
            src={staticMapUrl}
            alt={`Mapa placeholder para ${title}`}
            fill
            className="object-cover"
            data-ai-hint="mapa placeholder coordenadas"
        />
    );
    externalMapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    mapProviderUsed = 'Placeholder (Coordenadas)';
  }
  // 5. Fallback para placeholder com endereço
  else if (mapAddress) {
    const staticMapUrl = `https://placehold.co/600x400.png?text=Mapa+(${encodeURIComponent(mapAddress)})&font=roboto`;
    mapContent = (
        <Image
            src={staticMapUrl}
            alt={`Mapa placeholder para ${mapAddress}`}
            fill
            className="object-cover"
            data-ai-hint="mapa placeholder endereco"
        />
    );
    externalMapLink = `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}`;
    mapProviderUsed = 'Placeholder (Endereço)';
  }
  // 6. Nenhuma informação de mapa
  else {
    mapContent = (
      <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground p-4">
        <Info className="h-12 w-12 mb-2" />
        <p>Informações do mapa não disponíveis para este lote.</p>
      </div>
    );
    mapProviderUsed = 'Indisponível';
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" /> {displayTitle}
          </CardTitle>
          {externalMapLink && (
            <Button variant="outline" size="sm" asChild>
                <a href={externalMapLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span className="hidden sm:inline mr-1.5">—</span> {/* Visível apenas em telas maiores */}
                    <span className="sm:hidden">Ver</span> {/* Visível apenas em telas menores */}
                    <span className="hidden sm:inline mr-1.5">Ver no Mapa</span>
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">(Abre em nova aba)</span>
                </a>
            </Button>
          )}
        </div>
         <CardDescription className="text-xs">Provedor: {mapProviderUsed}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full rounded-md overflow-hidden border relative">
          {mapContent}
        </div>
      </CardContent>
    </Card>
  );
}

