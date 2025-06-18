
'use client';

import type { Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Info } from 'lucide-react';

interface LotMapDisplayProps {
  lot: Lot;
  platformSettings: PlatformSettings;
}

export default function LotMapDisplay({ lot, platformSettings }: LotMapDisplayProps) {
  const { mapSettings } = platformSettings;
  const { latitude, longitude, mapEmbedUrl, mapStaticImageUrl, mapAddress } = lot;

  const displayTitle = mapAddress || (latitude && longitude ? `${latitude}, ${longitude}` : "Localização do Lote");

  if (mapEmbedUrl && (mapSettings?.defaultProvider === 'google' || mapSettings?.defaultProvider === 'openstreetmap')) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" /> {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full rounded-md overflow-hidden border">
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa para ${lot.title}`}
            ></iframe>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mapStaticImageUrl && mapSettings?.defaultProvider === 'staticImage') {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" /> {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border">
            <Image
              src={mapStaticImageUrl}
              alt={`Mapa estático para ${lot.title}`}
              fill
              className="object-cover"
              data-ai-hint="mapa localizacao estatico"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (latitude && longitude) {
    // Fallback para uma imagem de placeholder se a API do Google não puder ser usada sem chave
    // ou para um link direto
    const googleApiKey = mapSettings?.googleMapsApiKey;
    const zoom = mapSettings?.staticImageMapZoom || 15;
    const markerColor = mapSettings?.staticImageMapMarkerColor || 'red';
    
    let staticMapUrl = `https://placehold.co/600x400.png?text=Mapa+(${latitude.toFixed(2)},${longitude.toFixed(2)})`;
    let dataAiHint = "mapa placeholder";

    if (googleApiKey) {
      staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=600x400&maptype=roadmap&markers=color:${markerColor}%7C${latitude},${longitude}&key=${googleApiKey}`;
      dataAiHint = "mapa google estatico";
    }

    return (
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" /> {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border">
            <Image
              src={staticMapUrl}
              alt={`Mapa para ${lot.title}`}
              fill
              className="object-cover"
              data-ai-hint={dataAiHint}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary" /> Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-6">
        <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Informações do mapa não disponíveis para este lote.</p>
      </CardContent>
    </Card>
  );
}
    