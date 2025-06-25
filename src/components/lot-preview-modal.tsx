
'use client';

import type { Lot, Auction } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, MapPin, Tag, DollarSign, Eye, ChevronLeft, ChevronRight, ImageOff, FileText, SlidersHorizontal, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotDescriptionTab from './auction/lot-description-tab';
import LotSpecificationTab from './auction/lot-specification-tab';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Separator } from './ui/separator';

interface LotPreviewModalProps {
  lot: Lot | null;
  auction?: Auction; // Auction context is optional, but useful
  isOpen: boolean;
  onClose: () => void;
}

export default function LotPreviewModal({ lot, auction, isOpen, onClose }: LotPreviewModalProps) {
  if (!isOpen || !lot) return null;

  const gallery = useMemo(() => {
    const images = [lot.imageUrl, ...(lot.galleryImageUrls || [])].filter(Boolean) as string[];
    if (images.length === 0) {
      images.push('https://placehold.co/800x600.png?text=Imagem+Indispon%C3%ADvel');
    }
    return images;
  }, [lot.imageUrl, lot.galleryImageUrls]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % gallery.length); };
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length); };

  const hasLegalInfo = auction?.documentsUrl || lot.judicialProcessNumber;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold font-headline line-clamp-2">{lot.title}</DialogTitle>
          <DialogDescription>Lote Nº: {lot.number || lot.id.replace('LOTE', '')} | Leilão: {lot.auctionName || auction?.title}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto px-4 sm:px-6 space-y-4">
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
            <Image
              src={gallery[currentImageIndex]}
              alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`}
              fill className="object-contain" data-ai-hint={lot.dataAiHint || 'imagem lote preview'}
              priority={currentImageIndex === 0}
            />
            {gallery.length > 1 && (
              <>
                <Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-8 w-8 rounded-full shadow-md" aria-label="Imagem Anterior"><ChevronLeft className="h-5 w-5" /></Button>
                <Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-8 w-8 rounded-full shadow-md" aria-label="Próxima Imagem"><ChevronRight className="h-5 w-5" /></Button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-1.5">
              {gallery.map((imgUrl, index) => (
                <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index);}} className={`relative aspect-square bg-muted rounded-sm overflow-hidden border-2 flex-shrink-0 ${ index === currentImageIndex ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-muted-foreground/50' }`} >
                  <Image src={imgUrl} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'miniatura galeria lote'} />
                </button>
              ))}
            </div>
          )}

          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Descrição</TabsTrigger>
              <TabsTrigger value="specification">Especificações</TabsTrigger>
              <TabsTrigger value="documents" disabled={!hasLegalInfo}>Documentos</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4"><LotDescriptionTab lot={lot} /></TabsContent>
            <TabsContent value="specification" className="mt-4"><LotSpecificationTab lot={lot} /></TabsContent>
            <TabsContent value="documents" className="mt-4">
              <Card className="shadow-none border-0"><CardHeader className="px-1 pt-0"><CardTitle className="text-lg font-semibold flex items-center"><FileText className="h-5 w-5 mr-2" />Documentos e Laudos</CardTitle></CardHeader>
                <CardContent className="px-1 text-sm space-y-2">
                  {auction?.documentsUrl && ( <p><strong className="text-foreground">Edital do Leilão:</strong> <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver Edital Completo</a></p> )}
                  {lot.judicialProcessNumber && ( <p><strong className="text-foreground">Nº Processo Judicial:</strong> <span className="text-muted-foreground">{lot.judicialProcessNumber}</span></p> )}
                  {!auction?.documentsUrl && !lot.judicialProcessNumber && (<p className="text-muted-foreground">Nenhum documento adicional para este lote.</p>)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 sm:p-6 sm:justify-start border-t bg-background sticky bottom-0">
          <Button variant="outline" onClick={onClose}> Fechar </Button>
          <Button asChild>
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
                <Eye className="mr-2 h-4 w-4" /> Ver Página do Lote
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
