
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { Lot, AuctionStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Tag, CalendarClock, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';
import { Button } from '../ui/button';

interface CurrentLotDisplayProps {
  lot: Lot;
  auctionStatus: AuctionStatus; // To help determine overall context
}

export default function CurrentLotDisplay({ lot, auctionStatus }: CurrentLotDisplayProps) {
  const gallery = useMemo(() => {
    if (!lot) return ['https://placehold.co/800x600.png?text=Imagem+Indisponivel'];
    const mainImage = [lot.imageUrl].filter(Boolean) as string[];
    const galleryImages = (lot.galleryImageUrls || []).filter(Boolean) as string[];
    const combined = [...mainImage, ...galleryImages];
    const uniqueUrls = Array.from(new Set(combined));
    return uniqueUrls.length > 0 ? uniqueUrls : ['https://placehold.co/800x600.png?text=Imagem+Indisponivel'];
  }, [lot]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Reset image index if lot changes
    setCurrentImageIndex(0);
  }, [lot.id]);


  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';

  // Placeholder timer - in a real app, this would be driven by a WebSocket or frequent polling
  const [timer, setTimer] = useState("00:04:55");
  useEffect(() => {
    if (lot.status === 'ABERTO_PARA_LANCES') {
      // Simulate countdown - replace with actual logic
      let duration = 295; // 4 minutes 55 seconds
      const interval = setInterval(() => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        if (--duration < 0) {
          clearInterval(interval);
          setTimer("Encerrado");
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimer(getAuctionStatusText(lot.status));
    }
  }, [lot.status]);


  return (
    <Card className="h-full flex flex-col shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="p-3 md:p-4 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg md:text-xl font-bold truncate">
            Lote {lot.number || lot.id.replace('LOTE', '')}: {lot.title}
          </CardTitle>
          <Badge variant="outline" className={`text-xs ${getLotStatusColor(lot.status)}`}>
            {getAuctionStatusText(lot.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col md:flex-row gap-3 md:gap-4 overflow-hidden">
        {/* Image Gallery */}
        <div className="md:w-3/5 p-3 md:p-4 flex flex-col items-center justify-center bg-muted/30">
          <div className="relative w-full aspect-video rounded-md overflow-hidden shadow-inner">
             {gallery.length > 0 && gallery[currentImageIndex] ? (
              <Image
                src={gallery[currentImageIndex]}
                alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`}
                fill
                className="object-contain"
                data-ai-hint={lot.dataAiHint || "imagem lote atual"}
                priority
              />
             ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ImageOff className="h-16 w-16 mb-2" />
                <span>Imagem indisponível</span>
              </div>
             )}
            {gallery.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 h-8 w-8 rounded-full"
                  aria-label="Imagem Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 h-8 w-8 rounded-full"
                  aria-label="Próxima Imagem"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto py-1">
              {gallery.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-16 h-12 rounded-sm overflow-hidden border-2 flex-shrink-0 ${
                    index === currentImageIndex ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                >
                  <Image src={imgUrl} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || "miniatura galeria"} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lot Info & Countdown */}
        <div className="md:w-2/5 p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto">
          <div>
            <p className="text-xs text-muted-foreground">Descrição Resumida</p>
            <p className="text-sm text-foreground line-clamp-3">
              {lot.description || 'Sem descrição detalhada para este lote.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <span className="text-muted-foreground">Local: <strong className="text-foreground">{displayLocation}</strong></span>
            </div>
            <div className="flex items-center">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <span className="text-muted-foreground">Categoria: <strong className="text-foreground">{lot.type}</strong></span>
            </div>
          </div>
           <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Lance Inicial / Avaliação:</p>
                <p className="text-lg font-semibold text-foreground">
                    R$ {(lot.initialPrice || lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>

            {lot.status === 'ABERTO_PARA_LANCES' && (
                <div className="mt-auto pt-3 border-t border-dashed">
                    <p className="text-sm text-center font-medium text-destructive mb-1">Tempo Restante:</p>
                    <div className="text-3xl md:text-4xl font-bold text-center text-destructive tabular-nums tracking-tight">
                        {timer}
                    </div>
                </div>
            )}
             {(lot.status === 'EM_BREVE' || lot.status === 'ENCERRADO' || lot.status === 'VENDIDO' || lot.status === 'NAO_VENDIDO' ) && (
                <div className="mt-auto pt-3 border-t border-dashed">
                     <p className="text-sm text-center font-medium text-muted-foreground mb-1">Status do Lote:</p>
                    <div className="text-2xl md:text-3xl font-bold text-center text-muted-foreground tracking-tight">
                        {getAuctionStatusText(lot.status)}
                    </div>
                    {lot.status === 'EM_BREVE' && lot.endDate && (
                         <p className="text-xs text-center text-muted-foreground">
                            Inicia em: {format(new Date(lot.endDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                    )}
                </div>
            )}

        </div>
      </CardContent>
    </Card>
  );
}
