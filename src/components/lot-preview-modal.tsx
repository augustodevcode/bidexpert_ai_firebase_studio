
'use client';

import type { Lot, Auction, PlatformSettings } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Eye, ChevronLeft, ChevronRight, ImageOff, MapPin, Tag, Clock, Users, Gavel, Percent, Zap, TrendingUp, Crown, Building, Car, Truck, Info, Leaf, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from './ui/separator';
import { isPast, differenceInSeconds, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const TimeRemaining: React.FC<{endDate: Date | string | null}> = ({ endDate }) => {
    const [remaining, setRemaining] = useState('');

    useEffect(() => {
        if (!endDate) return;

        const interval = setInterval(() => {
            const end = new Date(endDate);
            if (isPast(end)) {
                setRemaining('Encerrado');
                clearInterval(interval);
                return;
            }
            const totalSeconds = differenceInSeconds(end, new Date());
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (days > 0) setRemaining(`${days}d ${hours}h`);
            else setRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);

        }, 1000);

        return () => clearInterval(interval);
    }, [endDate]);

    return <>{remaining || 'Calculando...'}</>;
}


export default function LotPreviewModal({ lot, auction, platformSettings, isOpen, onClose }: LotPreviewModalProps) {
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

  const formattedEndDate = lot.endDate ? format(new Date(lot.endDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não definida';


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold font-headline line-clamp-2">{lot.title}</DialogTitle>
          <DialogDescription>Lote Nº: {lot.number || lot.id.replace('LOTE', '')}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto px-4 sm:px-6">
            {/* Image Gallery */}
            <div className="space-y-2">
                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                    <Image src={gallery[currentImageIndex]} alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`} fill className="object-contain" data-ai-hint={lot.dataAiHint || 'imagem lote preview'} priority />
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
                                <Image src={imgUrl} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Details & Triggers */}
            <div className="space-y-4">
                <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-500/30">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <TrendingUp className="h-5 w-5"/>
                        <p className="font-bold">Alta Demanda!</p>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        {lot.views || 0} pessoas viram este lote. {lot.bidsCount || 0} lances já foram feitos.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Lance Atual</p>
                    <p className="text-4xl font-bold text-primary">R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-muted-foreground">Próximo lance mínimo: R$ {(lot.price + (lot.bidIncrementStep || 100)).toLocaleString('pt-BR')}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                    <div className="flex items-center text-destructive font-semibold">
                        <Clock className="h-5 w-5 mr-2" />
                        <span className="text-lg">Encerra em: <TimeRemaining endDate={lot.endDate} /></span>
                    </div>
                    {discountPercentage > 0 && (
                        <div className="flex items-center text-green-600 font-semibold">
                            <Percent className="h-5 w-5 mr-2" />
                            <span className="text-lg">{discountPercentage}% de Desconto sobre a 1ª Praça</span>
                        </div>
                    )}
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
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span>Prazo: {formattedEndDate}</span>
          </div>
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
