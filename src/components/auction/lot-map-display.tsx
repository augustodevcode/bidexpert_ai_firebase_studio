
'use client';

import type { Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { MapPin, Info, ExternalLink } from 'lucide-react';

interface LotMapDisplayProps {
  lot: Lot;
  platformSettings: PlatformSettings;
}

export default function LotMapDisplay({ lot, platformSettings }: LotMapDisplayProps) {
  const { mapSettings } = platformSettings || { mapSettings: {} }; // Garante que mapSettings exista
  const { latitude, longitude, mapEmbedUrl, mapStaticImageUrl, mapAddress, title } = lot;

  const displayAddress = mapAddress || (latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : "Localização do Lote");

  let mapContent = null;
  let externalMapLink: string | null = null;
  let mapProviderUsed: string = 'Configuração Pendente';

  // 1. Priorizar mapEmbedUrl se fornecido pelo admin no lote
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
    externalMapLink = mapEmbedUrl; // Assumindo que o embed URL pode ser um link clicável também, ou gerar um específico.
    mapProviderUsed = mapEmbedUrl.includes("google.com/maps/embed") ? 'Google Maps (Embed do Lote)' : 'Embed Personalizado (Lote)';
  } 
  // 2. Se não tiver embed no lote, usar o defaultProvider e API Key das configurações da plataforma
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
    mapProviderUsed = 'Google Maps API (Plataforma)';
  } 
  else if (mapSettings?.defaultProvider === 'openstreetmap' && (latitude && longitude || mapAddress)) {
    const bboxDelta = 0.005; // Menor delta para zoom mais próximo
    let embedUrl = '';
    if (latitude && longitude) {
        embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - bboxDelta},${latitude - bboxDelta},${longitude + bboxDelta},${latitude + bboxDelta}&layer=mapnik&marker=${latitude},${longitude}`;
        externalMapLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${mapSettings.staticImageMapZoom || 16}/${latitude}/${longitude}`;
    } else if (mapAddress) {
        // Embed direto por endereço não é trivial no OpenStreetMap sem geocoding prévio
        // Mostrar link para busca se apenas endereço está disponível
        externalMapLink = `https://www.openstreetmap.org/search?query=${encodeURIComponent(mapAddress)}`;
        mapContent = (
             <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground p-4">
                <MapPin className="h-12 w-12 mb-2" />
                <p>Visualização de mapa para endereço via OpenStreetMap não disponível.</p>
                <a href={externalMapLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 flex items-center">
                    Buscar no OpenStreetMap <ExternalLink className="h-3 w-3 ml-1" />
                </a>
            </div>
        );
    }
    if (embedUrl && !mapContent) { 
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
    mapProviderUsed = 'OpenStreetMap (Plataforma)';
  }
  // 3. Fallback para imagem estática do lote se configurada
  else if (mapStaticImageUrl) {
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
     mapProviderUsed = 'Imagem Estática (Lote)';
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
    <Card className="shadow-md w-full">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" /> Localização
          </CardTitle>
          {externalMapLink && (
            <a 
              href={externalMapLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary hover:underline flex items-center"
            >
              <span className="truncate max-w-[180px] sm:max-w-xs">{displayAddress}</span>
              <ExternalLink className="h-3 w-3 ml-1.5 flex-shrink-0" />
              <span className="sr-only">(Abre em nova aba)</span>
            </a>
          )}
        </div>
         <CardDescription className="text-xs mt-0.5">Provedor: {mapProviderUsed}</CardDescription>
      </CardHeader>
      <CardContent className="p-0"> {/* Remover padding para o mapa ocupar todo o content */}
        <div className="aspect-square w-full rounded-b-md overflow-hidden border-t relative">
          {mapContent}
        </div>
      </CardContent>
    </Card>
  );
}

