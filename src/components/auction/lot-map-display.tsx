
'use client';

import type { Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; 
import { MapPin, Info, ExternalLink } from 'lucide-react';
import { samplePlatformSettings } from '@/lib/sample-data'; // Para fallback

interface LotMapDisplayProps {
  lot: Lot;
  platformSettings?: PlatformSettings; // Tornando opcional para usar samplePlatformSettings como fallback
}

// Helper function para extrair o parâmetro 'q' de uma URL de embed do Google Maps
function extractQueryFromGoogleEmbed(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    if (url.hostname === "www.google.com" && url.pathname.includes("/maps/embed")) {
      return url.searchParams.get("q");
    }
  } catch (e) {
    // URL inválida ou não é possível parsear
    console.warn("Could not parse embed URL:", embedUrl, e);
  }
  return null;
}

const defaultMapSettings = samplePlatformSettings.mapSettings;


export default function LotMapDisplay({ lot, platformSettings }: LotMapDisplayProps) {
  const settings = platformSettings || samplePlatformSettings; // Usa settings passadas ou o padrão
  const mapSettings = settings.mapSettings || defaultMapSettings;
  const { latitude, longitude, mapEmbedUrl, mapStaticImageUrl, mapAddress, title } = lot;

  const displayAddressText = mapAddress || (latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : "Localização do Lote");

  let mapContent = null;
  let mapProviderUsedForDisplay: string = 'Configuração Pendente';

  // 1. Determinar o conteúdo do mapa (mapContent)
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
    mapProviderUsedForDisplay = mapEmbedUrl.includes("google.com/maps/embed") ? 'Google Maps (Embed Fornecido)' : 'Embed Personalizado';
  } else if (mapSettings?.defaultProvider === 'google' && mapSettings?.googleMapsApiKey && (latitude || longitude || mapAddress)) {
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
    mapProviderUsedForDisplay = 'Google Maps API (Plataforma)';
  } else if (mapSettings?.defaultProvider === 'openstreetmap' && (latitude || longitude || mapAddress)) {
    const bboxDelta = 0.005;
    let embedUrl = '';
    if (latitude && longitude) {
        embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - bboxDelta},${latitude - bboxDelta},${longitude + bboxDelta},${latitude + bboxDelta}&layer=mapnik&marker=${latitude},${longitude}`;
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
    } else if (mapAddress) {
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
    }
    mapProviderUsedForDisplay = 'OpenStreetMap (Plataforma)';
  } else if (mapStaticImageUrl) {
    mapContent = (
        <Image
          src={mapStaticImageUrl}
          alt={`Mapa estático para ${title}`}
          fill
          className="object-cover"
          data-ai-hint="mapa localizacao estatico"
        />
    );
     mapProviderUsedForDisplay = 'Imagem Estática (Fornecida)';
  } else if (latitude && longitude) {
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
    mapProviderUsedForDisplay = 'Placeholder (Coordenadas)';
  } else if (mapAddress) {
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
    mapProviderUsedForDisplay = 'Placeholder (Endereço)';
  } else {
    mapContent = (
      <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground p-4">
        <Info className="h-12 w-12 mb-2" />
        <p>Informações do mapa não disponíveis para este lote.</p>
      </div>
    );
    mapProviderUsedForDisplay = 'Indisponível';
  }

  // 2. Determinar o link externo (finalExternalMapLink)
  let finalExternalMapLink: string | null = null;
  if (latitude && longitude) {
    // Prioridade máxima: usar coordenadas para um link de busca universal do Google Maps
    finalExternalMapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  } else if (mapAddress) {
    // Segunda prioridade: usar o endereço para um link de busca
    finalExternalMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;
  } else if (mapEmbedUrl) {
    // Terceira prioridade: se houver URL de embed
    if (mapEmbedUrl.includes("google.com/maps/embed")) {
      const queryFromEmbed = extractQueryFromGoogleEmbed(mapEmbedUrl);
      if (queryFromEmbed) {
        finalExternalMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryFromEmbed)}`;
      } else {
        // Se é um embed do Google mas não conseguimos extrair 'q',
        // não é seguro usar o mapEmbedUrl diretamente como link externo, pois pode dar erro.
        // Poderia até tentar um link genérico com o título do lote se nada mais estiver disponível.
        // Para agora, deixaremos nulo se não puder ser convertido para um link de busca.
        console.warn("Não foi possível gerar um link externo de busca a partir do Google Maps Embed URL fornecido:", mapEmbedUrl);
        finalExternalMapLink = null; 
      }
    } else {
      // Para embeds não-Google, assumimos que a URL é clicável diretamente.
      finalExternalMapLink = mapEmbedUrl;
    }
  } else if (mapStaticImageUrl) {
    // Se só temos imagem estática, tentamos um link de busca com o endereço de display
    finalExternalMapLink = `https://www.google.com/maps?q=${encodeURIComponent(displayAddressText)}`;
  }
  // Se finalExternalMapLink ainda for null, o link não será renderizado.

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" /> Localização
          </CardTitle>
          {finalExternalMapLink && (
            <a
              href={finalExternalMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center group"
            >
              <span className="truncate max-w-[180px] sm:max-w-xs">{displayAddressText}</span>
              <ExternalLink className="h-3 w-3 ml-1.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              <span className="sr-only">(Abrir mapa em nova aba)</span>
            </a>
          )}
        </div>
         <CardDescription className="text-xs mt-0.5">Provedor do mapa: {mapProviderUsedForDisplay}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-square w-full rounded-b-md overflow-hidden border-t relative">
          {mapContent}
        </div>
      </CardContent>
    </Card>
  );
}

