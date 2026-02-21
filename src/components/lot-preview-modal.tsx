

'use client';

import * as React from 'react';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, MapPin, Eye, ChevronLeft, ChevronRight, ImageOff, FileText, SlidersHorizontal, Info, ListChecks, Landmark, Calendar } from 'lucide-react';
import Link from 'next/link';
import BidExpertAuctionStagesTimeline from './auction/BidExpertAuctionStagesTimeline';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { isValidImageUrl } from '@/lib/ui-helpers';
import { Clock, Percent, Zap, TrendingUp, Crown, Building, Car, Truck, Leaf, Gavel, Users } from 'lucide-react';
import { isPast, differenceInSeconds, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from './ui/separator';
import { Badge } from '@/components/ui/badge';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, slugify, getAuctionStatusColor } from '@/lib/ui-helpers';
import LotCountdown from './lot-countdown';
import { useCurrency } from '@/contexts/currency-context';


interface LotPreviewModalProps {
  lot: Lot | null;
  auction?: Auction; 
  platformSettings: PlatformSettings;
  isOpen: boolean;
  onClose: () => void;
}


const InfoItem = ({ icon: Icon, value, label }: { icon: React.ElementType, value?: string | number | null, label: string }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-center text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md">
            <Icon className="h-5 w-5 mr-2 text-primary/80" />
            <span className="font-semibold text-foreground mr-1">{label}:</span>
            <span>{value}</span>
        </div>
    );
};


export default function LotPreviewModal({ lot, auction, platformSettings, isOpen, onClose }: LotPreviewModalProps) {
  const { formatCurrency } = useCurrency();
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

  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
  
  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || {};
  
  const discountPercentage = useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE')) {
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);


  const mentalTriggers = useMemo(() => {
    let triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    const settings = mentalTriggersGlobalSettings;

    if (settings.showPopularityBadge && (lot.views || 0) > (settings.popularityViewThreshold || 500)) triggers.push('MAIS VISITADO');
    if (settings.showHotBidBadge && (lot.bidsCount || 0) > (settings.hotBidThreshold || 10) && lot.status === 'ABERTO_PARA_LANCES') triggers.push('LANCE QUENTE');
    if (settings.showExclusiveBadge && lot.isExclusive) triggers.push('EXCLUSIVO');
    return Array.from(new Set(triggers));
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings]);

  const keySpecs = [
      { label: "Ano", value: lot.year, icon: CalendarDays },
      { label: "KM", value: lot.odometer, icon: Car },
      { label: "Câmbio", value: lot.transmissionType, icon: Car },
      { label: "Quartos", value: lot.bens?.[0]?.bedrooms, icon: Building },
      { label: "Área m²", value: lot.bens?.[0]?.area, icon: Building },
      { label: "Raça", value: lot.bens?.[0]?.breed, icon: Leaf },
  ].filter(spec => spec.value !== undefined && spec.value !== null);

  const { effectiveLotEndDate } = getEffectiveLotEndDate(lot, auction);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold font-headline">{lot.title}</DialogTitle>
          <DialogDescription>Lote Nº: {lot.number || lot.id.replace('LOTE', '')}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto px-4 sm:px-6">
            {/* Image Gallery */}
            <div className="space-y-2">
                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                    <Image src={gallery[currentImageIndex]} alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`} fill className="object-contain" data-ai-hint="imagem principal lote" priority />
                    {gallery.length > 1 && (
                        <>
                            <Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-8 w-8 rounded-full shadow-md"><ChevronLeft className="h-5 w-5" /></Button>
                            <Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-8 w-8 rounded-full shadow-md"><ChevronRight className="h-5 w-5" /></Button>
                        </>
                    )}
                </div>
                 {gallery.length > 1 && (
                    <div className="grid grid-cols-5 gap-1.5">
                        {gallery.slice(0, 5).map((imgUrl, index) => (
                            <button key={index} onClick={() => setCurrentImageIndex(index)} className={`relative aspect-square bg-muted rounded-sm overflow-hidden border-2 flex-shrink-0 ${ index === currentImageIndex ? 'border-primary' : 'border-transparent' }`} >
                                <Image src={imgUrl} alt={`Thumbnail ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'miniatura galeria'}/>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Details & Triggers */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Lance Atual</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(lot.price)}</p>
                  <p className="text-sm text-muted-foreground">Próximo lance mínimo: {formatCurrency(lot.price + (lot.bidIncrementStep || 100))}</p>
                </div>

                <div className="p-3 border rounded-lg text-center bg-card">
                    <p className="text-sm text-destructive font-semibold uppercase mb-1">Encerramento</p>
                    <LotCountdown endDate={effectiveLotEndDate} status={lot.status as any} />
                </div>
                
                 {keySpecs.length > 0 && (
                     <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {keySpecs.map(spec => (
                                <InfoItem key={spec.label} icon={spec.icon} value={`${spec.value}`} label={spec.label} />
                            ))}
                        </div>
                     </>
                 )}
            </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t bg-background flex justify-between w-full flex-shrink-0">
          <Button variant="outline" onClick={onClose}> Fechar </Button>
          <Button asChild size="lg" onClick={onClose}>
            <Link href={lotDetailUrl}>
                <Eye className="mr-2 h-5 w-5" /> Ver Detalhes e Dar Lance
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
