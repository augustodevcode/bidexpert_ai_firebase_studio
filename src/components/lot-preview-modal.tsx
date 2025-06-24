
'use client';

import type { Lot, Auction } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, MapPin, Tag, DollarSign, Eye, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data-helpers';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface LotPreviewModalProps {
  lot: Lot;
  auction?: Auction; // Auction context is optional, but useful
  isOpen: boolean;
  onClose: () => void;
}

export default function LotPreviewModal({ lot, auction, isOpen, onClose }: LotPreviewModalProps) {
  if (!isOpen || !lot) return null;

  const gallery = [lot.imageUrl, ...(lot.galleryImageUrls || [])].filter(Boolean).map(url => url || 'https://placehold.co/600x400.png');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita fechar o modal se o botão estiver sobre o conteúdo
    setCurrentImageIndex((prev) => (prev + 1) % (gallery.length || 1));
  }
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + (gallery.length || 1)) % (gallery.length || 1));
  }
  
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold font-headline line-clamp-2">{lot.title}</DialogTitle>
          <DialogDescription>Lote Nº: {lot.number || lot.id.replace('LOTE', '')} | Leilão: {lot.auctionName || auction?.title}</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 space-y-4">
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
            {gallery.length > 0 && gallery[currentImageIndex] ? (
              <Image
                src={gallery[currentImageIndex]}
                alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`}
                fill
                className="object-contain"
                data-ai-hint={lot.dataAiHint || 'imagem lote preview'}
                priority={currentImageIndex === 0}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ImageOff className="h-16 w-16 mb-2" />
                <span>Imagem principal não disponível</span>
              </div>
            )}
            {gallery.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background h-8 w-8 rounded-full shadow-md"
                  aria-label="Imagem Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background h-8 w-8 rounded-full shadow-md"
                  aria-label="Próxima Imagem"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-1.5">
              {gallery.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index);}}
                  className={`relative aspect-square bg-muted rounded-sm overflow-hidden border-2 flex-shrink-0 ${
                    index === currentImageIndex ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                >
                  <Image src={imgUrl} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'miniatura galeria lote'} />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-primary" /> Categoria: <span className="font-medium ml-1">{lot.type}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" /> Local: <span className="font-medium ml-1">{displayLocation}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" /> {lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual:' : 'Lance Inicial:'}
              <span className="font-semibold ml-1 text-lg text-primary">
                R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center">
               <Badge className={`text-xs px-2 py-0.5 ${getLotStatusColor(lot.status)} border-current`}>
                  {getAuctionStatusText(lot.status)}
              </Badge>
            </div>
             {lot.endDate && (
                <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-primary" /> Encerramento: 
                    <span className="font-medium ml-1">{format(new Date(lot.endDate as string), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
            )}
          </div>

          {lot.description && (
            <div>
              <h4 className="font-semibold mb-1">Descrição:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">{lot.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 sm:justify-start border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button asChild>
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                <Eye className="mr-2 h-4 w-4" /> Ver Lote Completo
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
