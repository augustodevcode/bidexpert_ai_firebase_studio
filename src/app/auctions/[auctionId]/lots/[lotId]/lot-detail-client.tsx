
'use client';

import type { Lot, Auction, BidInfo, Review, LotQuestion, SellerProfileInfo, PlatformSettings, AuctionStage, LotCategory, UserLotMaxBid } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, Key, Info,
    Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, ThumbsUp,
    ShieldCheck, HelpCircle, ShoppingCart, Heart, X, Facebook, Mail, MessageSquareText, Gavel, ImageOff, Loader2, FileText, ThumbsDown, MessageCircle, Send, Eye, ExternalLink, ListFilter, FileQuestion, Banknote, Building, Link2 as LinkIcon, AlertCircle, Percent, Zap, TrendingUp, Crown, Layers, UserCircle, Scale, Bot, Pencil
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isPast, differenceInSeconds, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addRecentlyViewedId } from '@/lib/recently-viewed-store';
import { useToast } from '@/hooks/use-toast';

import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, slugify, getAuctionStatusColor } from '@/lib/sample-data-helpers';

import { getReviewsForLot, createReview, getQuestionsForLot, askQuestionOnLot, getActiveUserLotMaxBid, placeBidOnLot } from './actions';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotDescriptionTab from '@/components/auction/lot-description-tab';
import LotSpecificationTab from '@/components/auction/lot-specification-tab';
import LotSellerTab from '@/components/auction/lot-seller-tab';
import LotReviewsTab from '@/components/auction/lot-reviews-tab';
import LotQuestionsTab from '@/components/auction/lot-questions-tab';

import LotPreviewModal from '@/components/lot-preview-modal';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import LotAllBidsModal from '@/components/auction/lot-all-bids-modal';
import LotCard from '@/components/lot-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BiddingPanel from '@/components/auction/bidding-panel';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import of the map component to ensure it only renders on the client
const LotMapDisplay = dynamic(() => import('@/components/auction/lot-map-display'), {
  ssr: false,
  loading: () => <Skeleton className="w-full aspect-square bg-muted rounded-md" />,
});

const LotMapPreviewModal = dynamic(() => import('@/components/lot-map-preview-modal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-background/50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});


interface DetailTimeRemainingProps {
  effectiveEndDate: Date | null;
  effectiveStartDate?: Date | null;
  lotStatus: Lot['status'];
  showUrgencyTimer?: boolean;
  urgencyThresholdDays?: number;
  urgencyThresholdHours?: number;
  className?: string;
}

export const DetailTimeRemaining: React.FC<DetailTimeRemainingProps> = ({
  effectiveEndDate,
  effectiveStartDate,
  lotStatus,
  showUrgencyTimer = true,
  urgencyThresholdDays = 1,
  urgencyThresholdHours = 0,
  className,
}) => {
  const [timeSegments, setTimeSegments] = useState<{days: string; hours: string; minutes: string; seconds: string} | null>(null);
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [formattedStartDate, setFormattedStartDate] = useState<string | null>(null);
  const [formattedEndDate, setFormattedEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveEndDate) {
      setDisplayMessage(getAuctionStatusText(lotStatus));
      setTimeSegments(null);
      return;
    }

    const end = effectiveEndDate instanceof Date ? effectiveEndDate : new Date(effectiveEndDate);

    const calculateTime = () => {
      const now = new Date();

      if (isPast(end) || lotStatus !== 'ABERTO_PARA_LANCES') {
        setDisplayMessage(getAuctionStatusText(status === 'ABERTO_PARA_LANCES' && isPast(end) ? 'ENCERRADO' : lotStatus));
        setTimeSegments(null);
        return;
      }

      const totalSecondsLeft = differenceInSeconds(end, now);
      if (totalSecondsLeft <= 0) {
        setDisplayMessage('Encerrado');
        setTimeSegments(null);
        return;
      }

      setDisplayMessage(null);

      const days = Math.floor(totalSecondsLeft / (3600 * 24));
      const hours = Math.floor((totalSecondsLeft % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSecondsLeft % 3600) / 60);
      const seconds = totalSecondsLeft % 60;

      setTimeSegments({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [effectiveEndDate, lotStatus]);

  // Client-side only date formatting to prevent hydration mismatch
  useEffect(() => {
    if (effectiveStartDate) {
      setFormattedStartDate(format(new Date(effectiveStartDate), 'dd/MM/yy HH:mm', { locale: ptBR }));
    }
    if (effectiveEndDate) {
      setFormattedEndDate(format(new Date(effectiveEndDate), 'dd/MM/yy HH:mm', { locale: ptBR }));
    }
  }, [effectiveStartDate, effectiveEndDate]);


  return (
    <div className={cn("absolute bottom-0 left-0 right-0 p-2 text-center text-white bg-gradient-to-t from-black/80 to-transparent", className)}>
      {timeSegments && lotStatus === 'ABERTO_PARA_LANCES' && effectiveEndDate && !isPast(new Date(effectiveEndDate)) ? (
        <>
          <p className="text-xs text-gray-200 uppercase tracking-wider mb-1">Encerra em:</p>
          <div className="flex justify-center items-baseline space-x-2 text-white">
            {parseInt(timeSegments.days, 10) > 0 && (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">{timeSegments.days}</span>
                  <span className="text-xs uppercase">dias</span>
                </div>
                <span className="text-2xl font-light self-center pb-1">|</span>
              </>
            )}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{timeSegments.hours}</span>
              <span className="text-xs uppercase">horas</span>
            </div>
            <span className="text-2xl font-light self-center pb-1">|</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{timeSegments.minutes}</span>
              <span className="text-xs uppercase">minutos</span>
            </div>
            <span className="text-2xl font-light self-center pb-1">|</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{timeSegments.seconds}</span>
              <span className="text-xs uppercase">segs</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-lg font-semibold text-gray-100">{displayMessage}</div>
      )}
       <div className="text-xs text-gray-300 mt-2 grid grid-cols-2 gap-x-2 px-2">
        {effectiveStartDate && (
           <div className="text-right">
             <span className="font-medium text-gray-100">Abertura:</span> {formattedStartDate || '...'}
           </div>
        )}
        {effectiveEndDate && (
           <div className="text-left">
             <span className="font-medium text-gray-100">Encerramento:</span> {formattedEndDate || '...'}
           </div>
        )}
      </div>
    </div>
  );
};

interface LotDetailClientContentProps {
  lot: Lot;
  auction: Auction;
  platformSettings: PlatformSettings;
  sellerName?: string | null;
  lotIndex?: number;
  previousLotId?: string;
  nextLotId?: string;
  totalLotsInAuction?: number;
}

function hasProcessInfo(lot: Lot): boolean {
    return !!(
        lot.judicialProcessNumber ||
        lot.courtDistrict ||
        lot.courtName ||
        lot.publicProcessUrl ||
        lot.propertyRegistrationNumber ||
        lot.propertyLiens ||
        lot.knownDebts ||
        lot.additionalDocumentsInfo
    );
}

export default function LotDetailClientContent({
  lot: initialLot,
  auction,
  platformSettings,
  sellerName: initialSellerName,
  lotIndex,
  previousLotId,
  nextLotId,
  totalLotsInAuction
}: LotDetailClientContentProps) {
  const [lot, setLot] = useState<Lot>(initialLot);
  const [isLotFavorite, setIsLotFavorite] = useState(false);
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [lotReviews, setLotReviews] = useState<Review[]>([]);
  const [lotQuestions, setLotQuestions] = useState<LotQuestion[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [formattedAuctionEndDate, setFormattedAuctionEndDate] = useState<string | null>(null);

  
  const hasEditPermissions = useMemo(() => 
    hasAnyPermission(userProfileWithPermissions, ['manage_all', 'lots:update']),
    [userProfileWithPermissions]
  );
  const editUrl = `/admin/lots/${lot.id}/edit`;
  
  const gallery = useMemo(() => {
    if (!lot) return [];
    const mainImage = typeof lot.imageUrl === 'string' && lot.imageUrl.trim() !== '' ? [lot.imageUrl] : [];
    const galleryImages = (lot.galleryImageUrls || []).filter(url => typeof url === 'string' && url.trim() !== '');
    const combined = [...mainImage, ...galleryImages];
    const uniqueUrls = Array.from(new Set(combined.filter(Boolean)));
    return uniqueUrls.length > 0 ? uniqueUrls : ['https://placehold.co/800x600.png?text=Imagem+Indisponivel'];
  }, [lot]);

  const { effectiveLotEndDate, effectiveLotStartDate } = useMemo(() => {
    if (!lot || !auction) return { effectiveLotEndDate: null, effectiveLotStartDate: null };
    let finalEndDate: Date | null = null;
    let finalStartDate: Date | null = null;
    if (auction.auctionStages && auction.auctionStages.length > 0) {
        const now = new Date();
        let relevantStage: AuctionStage | undefined = auction.auctionStages
            .filter(stage => stage.endDate && !isPast(new Date(stage.endDate as string)))
            .sort((a, b) => new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime())[0];
        if (!relevantStage && lot.status !== 'ENCERRADO' && lot.status !== 'VENDIDO' && lot.status !== 'NAO_VENDIDO') {
            relevantStage = auction.auctionStages.sort((a,b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime())[0];
        }
        if (relevantStage && relevantStage.endDate) {
            finalEndDate = new Date(relevantStage.endDate as string);
            const stageIndex = auction.auctionStages.findIndex(s => s.name === relevantStage!.name); 
            if (stageIndex > 0 && auction.auctionStages[stageIndex-1].endDate) {
                 finalStartDate = new Date(auction.auctionStages[stageIndex-1].endDate as string);
            } else {
                 finalStartDate = new Date(auction.auctionDate as string);
            }
        }
    }
    if (!finalEndDate && auction.endDate) finalEndDate = new Date(auction.endDate as string);
    if (!finalStartDate && auction.auctionDate) finalStartDate = new Date(auction.auctionDate as string);
    if (!finalEndDate && lot.endDate) finalEndDate = new Date(lot.endDate as string);
    if (!finalStartDate && lot.lotSpecificAuctionDate) finalStartDate = new Date(lot.lotSpecificAuctionDate as string);
    else if (!finalStartDate && lot.auctionDate) finalStartDate = new Date(lot.auctionDate as string);
    return { effectiveLotEndDate: finalEndDate, effectiveLotStartDate: finalStartDate };
  }, [lot, auction]);


  useEffect(() => {
    if (typeof window !== 'undefined') setCurrentUrl(window.location.href);
    
    // Format the date here to avoid hydration mismatch
    if (auction.endDate) {
      setFormattedAuctionEndDate(format(new Date(auction.endDate as string), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    }
    
    if (lot?.id) {
      addRecentlyViewedId(lot.id);
      setIsLotFavorite(isLotFavoriteInStorage(lot.id));
      setCurrentImageIndex(0);

      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          console.log(`[LotDetailClient] Fetching data for lot ID: ${lot.id}`);
          const [reviews, questions] = await Promise.all([
            getReviewsForLot(lot.publicId || lot.id),
            getQuestionsForLot(lot.publicId || lot.id),
          ]);
          setLotReviews(reviews);
          setLotQuestions(questions);
        } catch (error: any) {
          console.error("[LotDetailClient] Error fetching data:", error);
          toast({ title: "Erro", description: "Não foi possível carregar todos os dados do lote.", variant: "destructive" });
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [lot?.id, lot.publicId, toast, auction.endDate]);

  const handleBidSuccess = (updatedLotData: Partial<Lot>, newBid?: BidInfo) => {
    setLot(prevLot => ({...prevLot!, ...updatedLotData}));
    // Future: Could also update a local bid history state to be even faster
  };


  const lotTitle = `${lot?.year || ''} ${lot?.make || ''} ${lot?.model || ''} ${lot?.series || ''} ${lot?.title || ''}`.trim();
  const lotLocation = lot?.cityName && lot?.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot?.stateUf || lot?.cityName || 'Não informado';

  const isEffectivelySuperTestUser = userProfileWithPermissions?.email?.toLowerCase() === 'admin@bidexpert.com.br'.toLowerCase();
  const hasAdminRights = userProfileWithPermissions && hasPermission(userProfileWithPermissions, 'manage_all');
  const isUserHabilitado = userProfileWithPermissions?.habilitationStatus === 'HABILITADO';

  const canUserReview = !!userProfileWithPermissions;
  const canUserAskQuestion = isEffectivelySuperTestUser || hasAdminRights || (userProfileWithPermissions && isUserHabilitado);

  const handleToggleFavorite = () => {
    if (!lot || !lot.id) return;
    const newFavoriteState = !isLotFavorite;
    setIsLotFavorite(newFavoriteState);
    if (newFavoriteState) addFavoriteLotIdToStorage(lot.id);
    else removeFavoriteLotIdFromStorage(lot.id);
    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lotTitle}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x': return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email': return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };

  const mentalTriggersGlobalSettings = platformSettings.mentalTriggerSettings || {};
  const sectionBadges = platformSettings.sectionBadgeVisibility?.lotDetail || {
    showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true,
    showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true,
  };
  const discountPercentage = useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE')) {
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);
  const mentalTriggers = useMemo(() => {
    let triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    const settings = mentalTriggersGlobalSettings;
    if (sectionBadges.showPopularityBadge !== false && settings.showPopularityBadge && (lot.views || 0) > (settings.popularityViewThreshold || 500)) triggers.push('MAIS VISITADO');
    if (sectionBadges.showHotBidBadge !== false && settings.showHotBidBadge && (lot.bidsCount || 0) > (settings.hotBidThreshold || 10) && lot.status === 'ABERTO_PARA_LANCES') triggers.push('LANCE QUENTE');
    if (sectionBadges.showExclusiveBadge !== false && settings.showExclusiveBadge && lot.isExclusive) triggers.push('EXCLUSIVO');
    return Array.from(new Set(triggers));
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings, sectionBadges]);

  if (!lot || !auction) return <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary"/><p className="ml-2 text-muted-foreground">Carregando detalhes do lote...</p></div>;

  const nextImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev + 1) % gallery.length : 0));
  const prevImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev - 1 + gallery.length) % gallery.length : 0));
  const actualLotNumber = lot.number || String(lot.id).replace(/\D/g,'');
  const displayLotPosition = lotIndex !== undefined && lotIndex !== -1 ? lotIndex + 1 : 'N/A';
  const displayTotalLots = totalLotsInAuction || auction.totalLots || 'N/A';
  const handleNewReview = async (rating: number, comment: string) => { /* ... */ return false; };
  const handleNewQuestion = async (questionText: string) => { /* ... */ return false; };
  const relatedLots = useMemo(() => {
    if (!auction || !auction.lots || !lot) return [];
    return auction.lots.filter(relatedLot => relatedLot.id !== lot.id).slice(0, platformSettings.relatedLotsCount || 5);
  }, [auction, lot, platformSettings.relatedLotsCount]);
  const isJudicialAuction = auction.auctionType === 'JUDICIAL';
  const currentLotHasProcessInfo = hasProcessInfo(lot);
  const showLegalProcessTab = isJudicialAuction && currentLotHasProcessInfo;
  const legalTabTitle = showLegalProcessTab ? "Documentos e Processo" : "Documentos";

 return (
    <>
      <TooltipProvider>
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className="flex-grow">
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-left">{lotTitle}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs px-2 py-0.5 ${getLotStatusColor(lot.status)}`}>{getAuctionStatusText(lot.status)}</Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-wrap justify-start sm:justify-end mt-2 sm:mt-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Compartilhar"><Share2 className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><a href={getSocialLink('x', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><X className="h-4 w-4" /> X (Twitter)</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('facebook', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><Facebook className="h-4 w-4" /> Facebook</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><MessageSquareText className="h-4 w-4" /> WhatsApp</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('email', currentUrl, lotTitle)} className="flex items-center gap-2 cursor-pointer"><Mail className="h-4 w-4" /> Email</a></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" asChild aria-label="Voltar para o leilão"><Link href={`/auctions/${auction.publicId || auction.id}`}><ArrowLeft className="h-4 w-4" /></Link></Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Lote Nº: {actualLotNumber}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!previousLotId} disabled={!previousLotId} aria-label="Lote Anterior">{previousLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${previousLotId}`}><ChevronLeft className="h-4 w-4" /></Link> : <ChevronLeft className="h-4 w-4"/>}</Button>
                <span className="text-sm text-muted-foreground mx-1">Lote {displayLotPosition} de {displayTotalLots}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!nextLotId} disabled={!nextLotId} aria-label="Próximo Lote">{nextLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${nextLotId}`}><ChevronRight className="h-4 w-4" /></Link> : <ChevronRight className="h-4 w-4" />}</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg"><CardContent className="p-4"><div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden mb-4">{gallery.length > 0 && gallery[currentImageIndex] ? <Image src={gallery[currentImageIndex]} alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`} fill className="object-contain" data-ai-hint={lot.dataAiHint || "imagem principal lote"} priority={currentImageIndex === 0} unoptimized={gallery[currentImageIndex]?.startsWith('https://placehold.co')}/> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ImageOff className="h-16 w-16 mb-2" /><span>Imagem principal não disponível</span></div>}{platformSettings.showCountdownOnLotDetail !== false && (<DetailTimeRemaining effectiveEndDate={effectiveLotEndDate} effectiveStartDate={effectiveLotStartDate} lotStatus={lot.status} showUrgencyTimer={sectionBadges.showUrgencyTimer !== false && mentalTriggersGlobalSettings.showUrgencyTimer} urgencyThresholdDays={mentalTriggersGlobalSettings.urgencyTimerThresholdDays} urgencyThresholdHours={mentalTriggersGlobalSettings.urgencyTimerThresholdHours}/>)}{gallery.length > 1 && (<><Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Imagem Anterior"><ChevronLeft className="h-5 w-5" /></Button><Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Próxima Imagem"><ChevronRight className="h-5 w-5" /></Button></>)}</div>{gallery.length > 1 && (<div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">{gallery.map((url, index) => (<button key={index} className={`relative aspect-square bg-muted rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`} onClick={() => setCurrentImageIndex(index)} aria-label={`Ver imagem ${index + 1}`}><Image src={url} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem galeria carro'} unoptimized={url.startsWith('https://placehold.co')}/></button>))}</div>)}{gallery.length === 0 && (<p className="text-sm text-center text-muted-foreground py-4">Nenhuma imagem na galeria.</p>)}<div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">{lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}<span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary"/> Localização: {lotLocation}</span></div></CardContent></Card>
                <Card id="auction-details-section" className="shadow-lg"><CardHeader><CardTitle className="text-xl font-semibold flex items-center"><Gavel className="h-5 w-5 mr-2 text-muted-foreground" />Informações do Leilão</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0"><div className="flex items-start gap-4">{auction.auctioneerLogoUrl && (<Avatar className="h-16 w-16 border-2 border-primary/20 flex-shrink-0"><AvatarImage src={auction.auctioneerLogoUrl} alt={auction.auctioneerName || ''} data-ai-hint="logo leiloeiro" /><AvatarFallback>{auction.auctioneerName?.charAt(0) || 'L'}</AvatarFallback></Avatar>)}<div className="flex-grow"><Link href={`/auctions/${auction.publicId || auction.id}`} className="hover:text-primary"><p className="font-bold text-lg text-foreground">{auction.title}</p></Link><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 text-sm"><div className="flex items-center text-muted-foreground"><UserCircle className="h-4 w-4 mr-2" /><span>Leiloeiro: <span className="font-medium text-foreground">{auction.auctioneer}</span></span></div><div className="flex items-center text-muted-foreground"><Tag className="h-4 w-4 mr-2" /><span>Categoria: <span className="font-medium text-foreground">{auction.category}</span></span></div><div className="flex items-center text-muted-foreground"><Gavel className="h-4 w-4 mr-2" /><span>Modalidade: <span className="font-medium text-foreground">{auction.auctionType || 'Não especificada'}</span></span></div><div className="flex items-center text-muted-foreground"><Info className="h-4 w-4 mr-2" /><span>Status:<Badge variant="outline" className={`ml-2 text-xs ${getAuctionStatusColor(auction.status)} border-current`}>{getAuctionStatusText(auction.status)}</Badge></span></div>{auction.endDate && (<div className="flex items-center text-muted-foreground"><CalendarDays className="h-4 w-4 mr-2" /><span>Fim: <span className="font-medium text-foreground">{formattedAuctionEndDate || '...'}</span></span></div>)}</div></div></div></CardContent><CardFooter className="p-4 md:p-6 pt-0"><Button asChild variant="outline" size="sm"><Link href={`/auctions/${auction.publicId || auction.id}`}>Ver todos os lotes do leilão <ChevronRight className="h-4 w-4 ml-2" /></Link></Button></CardFooter></Card>
                <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-semibold flex items-center"><FileText className="h-5 w-5 mr-2 text-muted-foreground" />Detalhes do Lote</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0"><Tabs defaultValue="description" className="w-full"><TabsList className="flex w-full flex-wrap gap-1 mb-4"><TabsTrigger value="description">Descrição</TabsTrigger><TabsTrigger value="specification">Especificações</TabsTrigger><TabsTrigger value="legal">{legalTabTitle}</TabsTrigger><TabsTrigger value="seller">Comitente</TabsTrigger><TabsTrigger value="reviews">Avaliações</TabsTrigger><TabsTrigger value="questions">Perguntas</TabsTrigger></TabsList><TabsContent value="description"><LotDescriptionTab lot={lot} /></TabsContent><TabsContent value="specification"><LotSpecificationTab lot={lot} /></TabsContent><TabsContent value="legal"><Card className="shadow-none border-0"><CardHeader className="px-1 pt-0"><CardTitle className="text-xl font-semibold flex items-center"><FileText className="h-5 w-5 mr-2 text-muted-foreground" /> {legalTabTitle}</CardTitle></CardHeader><CardContent className="px-1 space-y-2 text-sm">{showLegalProcessTab && (<>{lot.judicialProcessNumber && <p><strong className="text-foreground">Nº Processo Judicial:</strong> <span className="text-muted-foreground">{lot.judicialProcessNumber}</span></p>}{lot.courtDistrict && <p><strong className="text-foreground">Comarca:</strong> <span className="text-muted-foreground">{lot.courtDistrict}</span></p>}{lot.courtName && <p><strong className="text-foreground">Vara:</strong> <span className="text-muted-foreground">{lot.courtName}</span></p>}{lot.publicProcessUrl && <p><strong className="text-foreground">Consulta Pública:</strong> <a href={lot.publicProcessUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Acessar Processo <LinkIcon className="h-3 w-3"/></a></p>}{lot.propertyRegistrationNumber && <p><strong className="text-foreground">Matrícula do Imóvel:</strong> <span className="text-muted-foreground">{lot.propertyRegistrationNumber}</span></p>}{lot.propertyLiens && <p><strong className="text-foreground">Ônus/Gravames:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.propertyLiens}</span></p>}{lot.knownDebts && <p><strong className="text-foreground">Dívidas Conhecidas:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.knownDebts}</span></p>}{lot.additionalDocumentsInfo && <p><strong className="text-foreground">Outras Informações/Links de Documentos:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.additionalDocumentsInfo}</span></p>}<Separator className="my-3" /></>)}{auction.documentsUrl && <p><strong className="text-foreground">Edital do Leilão:</strong> <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Ver Edital Completo <FileText className="h-3 w-3"/></a></p>}{!auction.documentsUrl && !showLegalProcessTab && (<p className="text-muted-foreground">Nenhuma informação legal ou documental adicional fornecida para este lote.</p>)}{auction.documentsUrl && !showLegalProcessTab && !currentLotHasProcessInfo && (<p className="text-muted-foreground mt-2 text-xs">Outras informações processuais específicas deste lote não foram fornecidas.</p>)}</CardContent></Card></TabsContent><TabsContent value="seller"><LotSellerTab sellerName={initialSellerName || auction.seller || "Não Informado"} sellerId={lot.sellerId} auctionSellerName={auction.seller} /></TabsContent><TabsContent value="reviews"><LotReviewsTab lot={lot} reviews={lotReviews} isLoading={isLoadingData} onNewReview={handleNewReview} canUserReview={canUserReview} /></TabsContent><TabsContent value="questions"><LotQuestionsTab lot={lot} questions={lotQuestions} isLoading={isLoadingData} onNewQuestion={handleNewQuestion} canUserAskQuestion={canUserAskQuestion} /></TabsContent></Tabs></CardContent></Card>
              </div>
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                  <BiddingPanel currentLot={lot} auction={auction} onBidSuccess={handleBidSuccess} />
                  <Card className="shadow-md"><CardHeader><CardTitle className="text-lg font-semibold flex items-center"><Scale className="h-5 w-5 mr-2 text-muted-foreground"/>Valores e Condições Legais</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{lot.evaluationValue && <div className="flex justify-between"><span className="text-muted-foreground">Valor de Avaliação:</span> <span className="font-semibold text-foreground">R$ {lot.evaluationValue.toLocaleString('pt-BR')}</span></div>}{lot.reservePrice && <div className="flex justify-between"><span className="text-muted-foreground">Preço de Reserva:</span> <span className="font-semibold text-foreground">(Confidencial)</span></div>}{lot.debtAmount && <div className="flex justify-between"><span className="text-muted-foreground">Montante da Dívida:</span> <span className="font-semibold text-foreground">R$ {lot.debtAmount.toLocaleString('pt-BR')}</span></div>}{lot.itbiValue && <div className="flex justify-between"><span className="text-muted-foreground">Valor de ITBI:</span> <span className="font-semibold text-foreground">R$ {lot.itbiValue.toLocaleString('pt-BR')}</span></div>}{(!lot.evaluationValue && !lot.reservePrice && !lot.debtAmount && !lot.itbiValue) && <p className="text-muted-foreground text-center text-xs py-2">Nenhuma condição de valor especial para este lote.</p>}</CardContent></Card>
                  <LotMapDisplay lot={lot} platformSettings={platformSettings} />
              </div>
            </div>
          </section>
          
          {platformSettings.showRelatedLotsOnLotDetail !== false && relatedLots.length > 0 && (
            <section className="pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6 font-headline text-center">Outros Lotes Deste Leilão</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedLots.map(relatedLot => (
                    <LotCard key={relatedLot.id} lot={relatedLot} auction={auction} platformSettings={platformSettings} badgeVisibilityConfig={platformSettings.sectionBadgeVisibility?.searchGrid} />
                ))}
              </div>
            </section>
          )}
        </div>
        {hasEditPermissions && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="fixed bottom-16 right-5 z-50 h-14 w-14 rounded-full shadow-lg" size="icon">
                  <Link href={editUrl}>
                    <Pencil className="h-6 w-6" />
                    <span className="sr-only">Editar Lote</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Editar Lote</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TooltipProvider>

      <LotPreviewModal lot={lot} auction={auction} platformSettings={platformSettings} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
      <LotMapPreviewModal lot={lot} platformSettings={platformSettings} isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} />
    </>
    );
}

```
- src/components/lot-map-preview-modal.tsx:
```tsx

// src/components/lot-map-preview-modal.tsx
'use client';

import type { Lot, PlatformSettings } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import to prevent SSR issues with Leaflet
const LotMapDisplay = dynamic(() => import('@/components/auction/lot-map-display'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full bg-muted rounded-md" />,
});

interface LotMapPreviewModalProps {
  lot: Lot | null;
  platformSettings: PlatformSettings;
  isOpen: boolean;
  onClose: () => void;
}

export default function LotMapPreviewModal({ lot, platformSettings, isOpen, onClose }: LotMapPreviewModalProps) {
  if (!isOpen || !lot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" /> Localização do Lote: {lot.title}
          </DialogTitle>
          <DialogDescription>
            {lot.mapAddress || (lot.latitude && lot.longitude ? `Coordenadas: ${lot.latitude}, ${lot.longitude}` : 'Detalhes da localização.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <LotMapDisplay lot={lot} platformSettings={platformSettings} />
        </div>

        <DialogFooter className="p-4 border-t sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```
- src/app/map-search/page.tsx:
```tsx

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, AlertCircle, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Lot, Auction, PlatformSettings } from '@/types';
import LotCard from '@/components/lot-card';
import AuctionCard from '@/components/auction-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { LatLngBounds } from 'leaflet';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';


const MapSearchComponent = dynamic(() => import('@/components/map-search-component'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-lg" />,
});

export default function MapSearchPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [searchType, setSearchType] = useState<'lots' | 'auctions'>((searchParamsHook.get('type') as 'lots' | 'auctions') || 'lots');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(4);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [isUserInteraction, setIsUserInteraction] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mapCenter) { // Set only if not already set, to avoid overriding
            setMapCenter([position.coords.latitude, position.coords.longitude]);
            setMapZoom(13);
          }
        },
        () => {
          if (!mapCenter) {
            console.warn("Geolocation permission denied. Defaulting to center of Brazil.");
            setMapCenter([-14.235, -51.9253]);
            setMapZoom(4);
          }
        },
        { timeout: 5000 }
      );
    } else {
        if (!mapCenter) {
            console.warn("Geolocation is not supported. Defaulting to center of Brazil.");
            setMapCenter([-14.235, -51.9253]);
            setMapZoom(4);
        }
    }

    async function fetchData() {
        setIsLoading(true);
        try {
            const [settings, auctions, lots] = await Promise.all([
                getPlatformSettings(),
                getAuctions(),
                getLots()
            ]);
            setPlatformSettings(settings);
            setAllAuctions(auctions);
            setAllLots(lots);
        } catch (err) {
            console.error("Failed to fetch map data", err);
            setError("Falha ao carregar dados do mapa.");
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUserInteraction(false); // Reset to fit bounds on new search
    // The filter logic will re-run automatically due to state change
  };

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setMapBounds(bounds);
    if (!isUserInteraction) {
        setIsUserInteraction(true);
    }
  }, [isUserInteraction]);
  
  const filteredItems = useMemo(() => {
    if (isLoading) return [];
    
    let baseItems = searchType === 'lots' ? allLots : allAuctions;
    
    let searchedItems = baseItems;
    const term = searchTerm.toLowerCase();
    if (term) {
         searchedItems = baseItems.filter(item => {
             const searchableText = `${item.title} ${item.description || ''} ${'city' in item ? item.city : ''} ${'state' in item ? item.state : ''} ${'cityName' in item ? item.cityName : ''} ${'stateUf' in item ? item.stateUf : ''}`;
             return searchableText.toLowerCase().includes(term);
         });
    }

    if (isUserInteraction && mapBounds) {
        return searchedItems.filter(item => {
            if (item.latitude && item.longitude) {
                return mapBounds.contains([item.latitude, item.longitude]);
            }
            return false;
        });
    }

    return searchedItems;

  }, [searchTerm, searchType, allLots, allAuctions, isLoading, mapBounds, isUserInteraction]);
  
  const displayedItems = filteredItems.slice(0, 50);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--header-height,160px)-1rem)] gap-4 md:gap-6">
        <Card className="md:w-2/5 lg:w-1/3 xl:w-1/4 flex flex-col shadow-lg h-full">
            <CardHeader className="p-4 border-b">
                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cidade, Estado, CEP ou Palavra-chave..."
                            className="h-10 pl-10 text-sm rounded-md w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={searchType} onValueChange={(value) => setSearchType(value as 'lots' | 'auctions')}>
                        <SelectTrigger className="h-9 flex-1 text-xs">
                            <SelectValue placeholder="Buscar por..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lots">Lotes</SelectItem>
                            <SelectItem value="auctions">Leilões</SelectItem>
                        </SelectContent>
                        </Select>
                        <Button type="submit" size="sm" className="h-9" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <SearchIcon className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </CardHeader>
            <ScrollArea className="flex-grow">
                <CardContent className="p-3 space-y-3">
                {isLoading && (
                    <div className="text-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
                    </div>
                )}
                {!isLoading && error && (
                    <div className="text-center py-6">
                        <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2"/>
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}
                {!isLoading && !error && displayedItems.length === 0 && (
                    <div className="text-center py-6">
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                        <p className="text-sm text-muted-foreground">Nenhum resultado encontrado. Tente uma busca diferente ou mova o mapa.</p>
                    </div>
                )}
                {!isLoading && !error && platformSettings && displayedItems.length > 0 && (
                    displayedItems.map(item => 
                    searchType === 'lots' 
                        ? <LotCard key={`lot-${item.id}`} lot={item as Lot} platformSettings={platformSettings} auction={allAuctions.find(a => a.id === (item as Lot).auctionId)} /> 
                        : <AuctionCard key={`auction-${item.id}`} auction={item as Auction} />
                    )
                )}
                </CardContent>
            </ScrollArea>
        </Card>

        <div className="flex-grow h-full md:h-auto rounded-lg overflow-hidden shadow-lg relative z-0">
             {mapCenter && <MapSearchComponent
                items={filteredItems}
                itemType={searchType}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                onBoundsChange={handleBoundsChange}
                shouldFitBounds={!isUserInteraction}
            />
            }
        </div>
    </div>
  );
}

```
- src/app/auctions/[auctionId]/page.tsx:
```tsx
// src/app/auctions/[auctionId]/page.tsx
import type { Auction, PlatformSettings, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import AuctionDetailsClient from './auction-details-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAuction, getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';

export const dynamic = 'force-dynamic';

async function getAuctionPageData(id: string): Promise<{ 
  auction?: Auction; 
  auctioneer?: AuctioneerProfileInfo | null;
  platformSettings: PlatformSettings;
  allCategories: LotCategory[];
  allSellers: SellerProfileInfo[];
}> {
  console.log(`[getAuctionPageData] Buscando leilão: ${id}`);
  
  const [
      platformSettingsData, 
      auctionFromDb, 
      allCategoriesData, 
      allSellersData,
      allAuctioneersData
    ] = await Promise.all([
    getPlatformSettings(),
    getAuction(id),
    getLotCategories(),
    getSellers(),
    getAuctioneers()
  ]);
  
  if (!auctionFromDb) {
    console.warn(`[getAuctionPageData] Leilão não encontrado para o ID/PublicID: ${id}.`);
    return { platformSettings: platformSettingsData, allCategories: allCategoriesData, allSellers: allSellersData };
  }
  
  const lotsForAuction = auctionFromDb.lots || await getLots(auctionFromDb.id);
  const auction = { ...auctionFromDb, lots: lotsForAuction, totalLots: lotsForAuction.length };
  
  let auctioneer: AuctioneerProfileInfo | null = null;
  if (auction.auctioneerId) {
      const found = allAuctioneersData.find(a => String(a.id) === String(auction.auctioneerId));
      auctioneer = found || null;
  } else if (auction.auctioneer) {
      const found = allAuctioneersData.find(a => a.name === auction.auctioneer);
      auctioneer = found || null;
  }
  
  console.log(`[getAuctionPageData] Leilão ID ${id} encontrado. Leiloeiro encontrado: ${!!auctioneer}`);
  
  return { auction, auctioneer, platformSettings: platformSettingsData, allCategories: allCategoriesData, allSellers: allSellersData };
}

export default async function AuctionDetailPage({ params }: { params: { auctionId: string } }) {
  if (!params.auctionId) {
    console.error("[AuctionDetailPage] auctionId está undefined nos params.");
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Erro ao Carregar Leilão</h1>
        <p className="text-muted-foreground">Não foi possível identificar o leilão a ser exibido.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }
  
  const { auction, auctioneer, platformSettings, allCategories, allSellers } = await getAuctionPageData(params.auctionId);

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground">O leilão que você está procurando (ID: {params.auctionId}) não existe ou não pôde ser carregado.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <AuctionDetailsClient 
          auction={auction} 
          auctioneer={auctioneer || null}
          platformSettings={platformSettings}
          allCategories={allCategories}
          allSellers={allSellers}
        />
    </div>
  );
}
```
- src/app/search/page.tsx:
```tsx

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon, FileText as TomadaPrecosIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import type { ActiveFilters } from '@/components/sidebar-filters'; 
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import DirectSaleOfferCard from '@/components/direct-sale-offer-card';
import DirectSaleOfferListItem from '@/components/direct-sale-offer-list-item';
import type { Auction, Lot, LotCategory, DirectSaleOffer, DirectSaleOfferType, PlatformSettings, SellerProfileInfo } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuctionListItem from '@/components/auction-list-item';
import SearchResultsFrame from '@/components/search-results-frame';
import dynamic from 'next/dynamic';
import SidebarFiltersSkeleton from '@/components/sidebar-filters-skeleton';

// Server Actions
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getDirectSaleOffers } from './actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';


const SidebarFilters = dynamic(() => import('@/components/sidebar-filters'), {
  loading: () => <SidebarFiltersSkeleton />,
  ssr: false,
});


const sortOptionsAuctions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'visits_desc', label: 'Mais Visitados' },
  { value: 'id_desc', label: 'Adicionados Recentemente' }
];

const sortOptionsLots = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'lotNumber_asc', label: 'Nº Lote: Menor ao Maior' },
  { value: 'lotNumber_desc', label: 'Nº Lote: Maior ao Menor' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];

const sortOptionsDirectSales = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'createdAt_desc', label: 'Mais Recentes' },
  { value: 'createdAt_asc', label: 'Mais Antigos' },
  { value: 'price_asc', label: 'Preço: Menor para Maior (Compra Já)' },
  { value: 'price_desc', label: 'Preço: Maior para Menor (Compra Já)' },
  { value: 'views_desc', label: 'Mais Visitados' },
];


const initialFiltersState: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' } = {
  modality: 'TODAS', 
  category: 'TODAS', 
  priceRange: [0, 1000000],
  locations: [],
  sellers: [],
  startDate: undefined,
  endDate: undefined,
  status: [],
  offerType: 'ALL',
  searchType: 'auctions',
};


export default function SearchPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  
  // State for different data types
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [allDirectSales, setAllDirectSales] = useState<DirectSaleOffer[]>([]);
  
  // State for shared filter data
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // State for UI and Filters
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [currentSearchType, setCurrentSearchType] = useState<'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos'>( (searchParamsHook.get('type') as any) || 'auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortByState] = useState<string>('relevance');
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Effect to fetch shared data for filters once
  useEffect(() => {
    async function fetchSharedData() {
      setIsFilterDataLoading(true);
      try {
        const [categories, sellers, settings] = await Promise.all([
          getLotCategories(),
          getSellers(),
          getPlatformSettings()
        ]);
        
        setAllCategoriesForFilter(categories);
        setUniqueSellersForFilter(sellers.map(s => s.name).sort());
        setPlatformSettings(settings);
        setItemsPerPage(settings.searchItemsPerPage || 12);
      } catch (error) {
        console.error("Error fetching shared filter data:", error);
      } finally {
        setIsFilterDataLoading(false);
      }
    }
    fetchSharedData();
  }, []);

  // Effect to fetch main content data based on the active tab
  useEffect(() => {
    async function fetchContentData() {
      setIsLoading(true);
      let locations = new Set<string>();

      try {
        switch (currentSearchType) {
          case 'auctions':
          case 'tomada_de_precos':
            const auctions = await getAuctions();
            setAllAuctions(auctions);
            auctions.forEach(item => {
                if (item.city && item.state) locations.add(`${item.city} - ${item.state}`);
            });
            break;
          case 'lots':
            const lots = await getLots();
            setAllLots(lots);
            lots.forEach(item => {
                if (item.cityName && item.stateUf) locations.add(`${item.cityName} - ${item.stateUf}`);
            });
            break;
          case 'direct_sale':
            const directSales = await getDirectSaleOffers();
            setAllDirectSales(directSales);
            directSales.forEach(item => {
                if (item.locationCity && item.locationState) locations.add(`${item.locationCity} - ${item.locationState}`);
            });
            break;
        }
        if (uniqueLocationsForFilter.length === 0 && locations.size > 0) {
            setUniqueLocationsForFilter(Array.from(locations).sort());
        }
      } catch (error) {
        console.error(`Error fetching data for tab ${currentSearchType}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContentData();
  }, [currentSearchType, uniqueLocationsForFilter.length]);


  const [activeFilters, setActiveFilters] = useState<ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' }>(() => {
    const initial: typeof initialFiltersState = {...initialFiltersState, searchType: 'auctions'};
    const typeParam = searchParamsHook.get('type') as typeof currentSearchType | null;
    const auctionTypeFromQuery = searchParamsHook.get('auctionType');

    if (typeParam) {
        if (typeParam === 'auctions' && auctionTypeFromQuery === 'TOMADA_DE_PRECOS') {
            initial.searchType = 'tomada_de_precos';
            initial.modality = 'TOMADA_DE_PRECOS';
        } else {
            initial.searchType = typeParam;
        }
    } else if (auctionTypeFromQuery === 'TOMADA_DE_PRECOS') {
        initial.searchType = 'tomada_de_precos';
        initial.modality = 'TOMADA_DE_PRECOS';
    }

    if (searchParamsHook.get('category')) initial.category = searchParamsHook.get('category')!;

    if (auctionTypeFromQuery && initial.searchType !== 'tomada_de_precos') {
        initial.modality = auctionTypeFromQuery.toUpperCase();
    }

    if (searchParamsHook.get('status')) initial.status = [searchParamsHook.get('status')!.toUpperCase()];
    else initial.status = (initial.searchType === 'direct_sale' || initial.searchType === 'tomada_de_precos') ? ['ACTIVE'] : [];

    if (searchParamsHook.get('offerType')) initial.offerType = searchParamsHook.get('offerType') as any;

    return initial;
  });


  useEffect(() => {
    const typeFromParams = searchParamsHook.get('type') as typeof currentSearchType | null;
    const auctionTypeFromParams = searchParamsHook.get('auctionType');

    let newSearchType: typeof currentSearchType = 'auctions'; 
    if (typeFromParams) {
        if (typeFromParams === 'auctions' && auctionTypeFromParams === 'TOMADA_DE_PRECOS') {
            newSearchType = 'tomada_de_precos';
        } else {
            newSearchType = typeFromParams;
        }
    } else if (auctionTypeFromParams === 'TOMADA_DE_PRECOS') {
        newSearchType = 'tomada_de_precos';
    }
    setCurrentSearchType(newSearchType);
    setCurrentPage(1);
    setItemsPerPage(platformSettings?.searchItemsPerPage || 12);
  }, [searchParamsHook, platformSettings]);


  const handleSearchTypeChange = (type: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos') => {
    setCurrentSearchType(type);
    setSortByState('relevance');

    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    const categoryParam = currentParams.get('category') || 'TODAS';

    if (type === 'tomada_de_precos') {
        currentParams.set('type', 'auctions');
        currentParams.set('auctionType', 'TOMADA_DE_PRECOS');
        setActiveFilters(prev => ({ ...initialFiltersState, searchType: 'tomada_de_precos', modality: 'TOMADA_DE_PRECOS', category: categoryParam, status: ['ACTIVE'] }));
    } else {
        currentParams.set('type', type);
        currentParams.delete('auctionType');
        setActiveFilters(prev => ({ ...initialFiltersState, searchType: type, category: categoryParam, status: type === 'direct_sale' ? ['ACTIVE'] : []}));
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleFilterSubmit = (filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; }) => {
    setActiveFilters(prev => ({...prev, ...filters, searchType: currentSearchType}));
    setIsFilterSheetOpen(false);
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', currentSearchType === 'tomada_de_precos' ? 'auctions' : currentSearchType);

    currentParams.set('category', filters.category);

    if (currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') {
        currentParams.set('auctionType', currentSearchType === 'tomada_de_precos' ? 'TOMADA_DE_PRECOS' : filters.modality);
    } else {
        currentParams.delete('auctionType');
    }

    if (currentSearchType === 'direct_sale' && filters.offerType) {
        currentParams.set('offerType', filters.offerType);
    } else {
        currentParams.delete('offerType');
    }

    if (filters.status && filters.status.length > 0) {
        currentParams.set('status', filters.status.join(','));
    } else {
        currentParams.delete('status');
    }
    router.push(`/search?${currentParams.toString()}`);
    setCurrentPage(1); 
  };

  const handleFilterReset = () => {
    const resetFilters: typeof initialFiltersState = {...initialFiltersState, searchType: currentSearchType};
    if (currentSearchType === 'tomada_de_precos') {
        resetFilters.modality = 'TOMADA_DE_PRECOS';
        resetFilters.status = ['ACTIVE'];
    } else if (currentSearchType === 'direct_sale') {
        resetFilters.status = ['ACTIVE'];
    }
    setActiveFilters(resetFilters);
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.delete('category');
    if (currentSearchType !== 'tomada_de_precos') currentParams.delete('auctionType');
    currentParams.delete('offerType');
    currentParams.delete('status');
    currentParams.set('type', currentSearchType === 'tomada_de_precos' ? 'auctions' : currentSearchType);
    if (currentSearchType === 'tomada_de_precos') currentParams.set('auctionType','TOMADA_DE_PRECOS');
    if (currentSearchType === 'direct_sale' || currentSearchType === 'tomada_de_precos') currentParams.set('status', 'ACTIVE');


    router.push(`/search?${currentParams.toString()}`);
    setIsFilterSheetOpen(false);
    setCurrentPage(1); 
  };

  const filteredAndSortedItems = useMemo(() => {
    let itemsToFilter: any[] = [];
    let itemTypeContext: 'auction' | 'lot' | 'direct_sale' = 'auction';

    if (currentSearchType === 'auctions') {
      itemsToFilter = allAuctions.filter(auc => auc.auctionType !== 'TOMADA_DE_PRECOS');
      itemTypeContext = 'auction';
    } else if (currentSearchType === 'lots') {
      itemsToFilter = allLots;
      itemTypeContext = 'lot';
    } else if (currentSearchType === 'direct_sale') {
      itemsToFilter = allDirectSales;
      itemTypeContext = 'direct_sale';
    } else if (currentSearchType === 'tomada_de_precos') {
      itemsToFilter = allAuctions.filter(auc => auc.auctionType === 'TOMADA_DE_PRECOS');
      itemTypeContext = 'auction';
    }

    // 1. Apply Search Term first
    let searchedItems = itemsToFilter;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        searchedItems = itemsToFilter.filter(item => {
            let searchableText = item.title.toLowerCase();
            if (item.description) searchableText += ` ${item.description.toLowerCase()}`;
            if ('auctionName' in item && item.auctionName) searchableText += ` ${item.auctionName.toLowerCase()}`;
            if ('sellerName' in item && item.sellerName) searchableText += ` ${item.sellerName.toLowerCase()}`;
            else if ('seller' in item && (item as Auction).seller) searchableText += ` ${(item as Auction).seller!.toLowerCase()}`;
            if ('id' in item && item.id) searchableText += ` ${item.id.toLowerCase()}`;
            return searchableText.includes(term);
        });
    }

    // 2. Apply other filters
    let filteredItems = searchedItems.filter(item => {
      if (activeFilters.category !== 'TODAS') {
        const itemCategoryName = 'type' in item && item.type ? item.type : ('category' in item ? item.category : undefined);
        const category = allCategoriesForFilter.find(c => c.slug === activeFilters.category);
        if (!itemCategoryName || !category || (item.categoryId !== category.id && slugify(itemCategoryName) !== category.slug)) return false;
      }
      const itemPrice = 'price' in item && typeof item.price === 'number' ? item.price : ('initialOffer' in item && typeof item.initialOffer === 'number' ? item.initialOffer : undefined);
      if (itemPrice !== undefined && (itemPrice < activeFilters.priceRange[0] || itemPrice > activeFilters.priceRange[1])) {
        return false;
      }
      if (activeFilters.locations.length > 0) {
        const itemLocationString = ('locationCity' in item && 'locationState' in item && item.locationCity && item.locationState) ? `${item.locationCity} - ${item.locationState}` : ('city' in item && 'state' in item && item.city && item.state) ? `${item.city} - ${item.state}` : ('cityName' in item && 'stateUf' in item && item.cityName && item.stateUf) ? `${item.cityName} - ${item.stateUf}` : undefined;
        if (!itemLocationString || !activeFilters.locations.includes(itemLocationString)) return false;
      }
      if (activeFilters.sellers.length > 0) {
        let sellerName: string | undefined = undefined;
        if ('sellerName' in item && item.sellerName) sellerName = item.sellerName;
        else if ('seller' in item && (item as Auction).seller) sellerName = (item as Auction).seller!;
        if (!sellerName || !activeFilters.sellers.includes(sellerName)) return false;
      }
      if (activeFilters.status && activeFilters.status.length > 0) {
          if (!item.status || !activeFilters.status.includes(item.status as string)) return false;
      }
      if (itemTypeContext === 'auction' && activeFilters.modality !== 'TODAS' && (item as Auction).auctionType?.toUpperCase() !== activeFilters.modality) return false;
      if (itemTypeContext === 'direct_sale' && activeFilters.offerType && activeFilters.offerType !== 'ALL' && (item as DirectSaleOffer).offerType !== activeFilters.offerType) return false;
      return true;
    });

    // 3. Apply sorting
    switch (sortBy) {
        case 'id_desc':
            filteredItems.sort((a,b) => String(b.id).localeCompare(String(a.id)));
            break;
        case 'endDate_asc':
            filteredItems.sort((a, b) => new Date((a as any).endDate).getTime() - new Date((b as any).endDate).getTime());
            break;
        case 'endDate_desc':
            filteredItems.sort((a, b) => new Date((b as any).endDate).getTime() - new Date((a as any).endDate).getTime());
            break;
        case 'price_asc':
             filteredItems.sort((a, b) => ((a as any).price ?? Infinity) - ((b as any).price ?? Infinity));
            break;
        case 'price_desc':
            filteredItems.sort((a, b) => ((b as any).price ?? -Infinity) - ((a as any).price ?? -Infinity));
            break;
        case 'views_desc':
            filteredItems.sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0));
            break;
        case 'createdAt_desc':
            filteredItems.sort((a,b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
            break;
        case 'lotNumber_asc':
            filteredItems.sort((a,b) => (parseInt(String((a as Lot).number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String((b as Lot).number || b.id).replace(/\D/g,'')) || 0));
            break;
        case 'relevance':
        default:
            break;
    }
    return filteredItems;
  }, [searchTerm, activeFilters, sortBy, currentSearchType, allAuctions, allLots, allDirectSales, allCategoriesForFilter]);

  const paginatedItems = useMemo(() => {
    if (!platformSettings) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, platformSettings, currentPage, itemsPerPage]);


  const handlePageChange = (newPage: number) => {
    const totalPages = itemsPerPage > 0 ? Math.ceil(filteredAndSortedItems.length / itemsPerPage) : 1;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };


  const currentSortOptions =
    currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos' ? sortOptionsAuctions :
    currentSearchType === 'lots' ? sortOptionsLots :
    sortOptionsDirectSales;

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', currentSearchType === 'tomada_de_precos' ? 'auctions' : currentSearchType);
    if (currentSearchType === 'tomada_de_precos') currentParams.set('auctionType', 'TOMADA_DE_PRECOS');

    if (searchTerm.trim()) {
        currentParams.set('term', searchTerm.trim());
    } else {
        currentParams.delete('term');
    }
    router.push(`/search?${currentParams.toString()}`);
    setCurrentPage(1); 
  };

  const renderGridItem = (item: any, index: number): React.ReactNode => {
    if (!platformSettings) return null;
    if (currentSearchType === 'lots') return <LotCard key={`${(item as Lot).auctionId}-${item.id}-${index}`} lot={item as Lot} auction={allAuctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings}/>;
    if (currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') return <AuctionCard key={`${item.id}-${index}`} auction={item as Auction} />;
    if (currentSearchType === 'direct_sale') return <DirectSaleOfferCard key={`${item.id}-${index}`} offer={item as DirectSaleOffer} />;
    return null;
  };

  const renderListItem = (item: any, index: number): React.ReactNode => {
    if (!platformSettings) return null;
    if (currentSearchType === 'lots') return <LotListItem key={`${(item as Lot).auctionId}-${item.id}-${index}`} lot={item as Lot} auction={allAuctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings}/>;
    if (currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') return <AuctionListItem key={`${item.id}-${index}`} auction={item as Auction} />;
    if (currentSearchType === 'direct_sale') return <DirectSaleOfferListItem key={`${item.id}-${index}`} offer={item as DirectSaleOffer} />;
    return null;
  };

  const getSearchTypeLabel = () => {
    switch(currentSearchType) {
        case 'auctions': return 'leilões';
        case 'lots': return 'lotes';
        case 'direct_sale': return 'ofertas';
        case 'tomada_de_precos': return 'tomadas de preços';
        default: return 'itens';
    }
  }

  if (isFilterDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando filtros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium">Resultados da Busca</span>
      </div>
      
      <form onSubmit={handleSearchFormSubmit} className="flex flex-col md:flex-row items-center gap-4 mb-6 max-w-3xl mx-auto">
        <div className="relative flex-grow w-full">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Buscar por palavra-chave, ID..."
            className="h-12 pl-12 text-md rounded-lg shadow-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Button type="submit" className="h-12 w-full md:w-auto">
          <SearchIcon className="mr-2 h-4 w-4 md:hidden" /> Buscar
        </Button>
        <div className="md:hidden w-full">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12">
                <SlidersHorizontal className="mr-2 h-5 w-5" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
                 <div className="p-4 h-full overflow-y-auto">
                    <SidebarFilters
                        categories={allCategoriesForFilter}
                        locations={uniqueLocationsForFilter}
                        sellers={uniqueSellersForFilter}
                        onFilterSubmit={handleFilterSubmit as any}
                        onFilterReset={handleFilterReset}
                        initialFilters={activeFilters as ActiveFilters}
                        filterContext={currentSearchType === 'tomada_de_precos' ? 'auctions' : (currentSearchType  as 'auctions' | 'directSales')}
                    />
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </form>
      
      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
        <aside className="hidden md:block sticky top-24 h-fit">
             <SidebarFilters
                categories={allCategoriesForFilter}
                locations={uniqueLocationsForFilter}
                sellers={uniqueSellersForFilter}
                onFilterSubmit={handleFilterSubmit as any}
                onFilterReset={handleFilterReset}
                initialFilters={activeFilters as ActiveFilters}
                filterContext={currentSearchType === 'tomada_de_precos' ? 'auctions' : (currentSearchType  as 'auctions' | 'directSales')}
            />
        </aside>
        
        <main className="min-w-0 space-y-6">
            <Tabs value={currentSearchType} onValueChange={(value) => handleSearchTypeChange(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 gap-1 sm:gap-2">
                <TabsTrigger value="auctions">Leilões ({currentSearchType === 'auctions' ? filteredAndSortedItems.length : allAuctions.filter(a=> a.auctionType !== 'TOMADA_DE_PRECOS').length})</TabsTrigger>
                <TabsTrigger value="lots">Lotes ({currentSearchType === 'lots' ? filteredAndSortedItems.length : allLots.length})</TabsTrigger>
                <TabsTrigger value="direct_sale">Venda Direta ({currentSearchType === 'direct_sale' ? filteredAndSortedItems.length : allDirectSales.length})</TabsTrigger>
                <TabsTrigger value="tomada_de_precos">Tomada de Preços ({currentSearchType === 'tomada_de_precos' ? filteredAndSortedItems.length : allAuctions.filter(a => a.auctionType === 'TOMADA_DE_PRECOS').length})</TabsTrigger>
            </TabsList>

            <SearchResultsFrame
              items={paginatedItems}
              totalItemsCount={filteredAndSortedItems.length}
              renderGridItem={renderGridItem}
              renderListItem={renderListItem}
              sortOptions={currentSortOptions}
              initialSortBy={sortBy}
              onSortChange={setSortByState}
              platformSettings={platformSettings}
              isLoading={isLoading}
              searchTypeLabel={getSearchTypeLabel()}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
            </Tabs>
        </main>
      </div>
    </div>
  );
}

```
- src/app/sellers/[sellerId]/page.tsx:
```tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getAuctionsBySellerSlug } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, Lot, PlatformSettings, SellerProfileInfo } from '@/types';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SearchResultsFrame from '@/components/search-results-frame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, Loader2, Mail, Phone, Globe, Briefcase, Users, TrendingUp, MessageSquare, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSellerBySlug } from '@/app/admin/sellers/actions';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';

const sortOptionsLots = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];

export default function SellerDetailsPage() {
  const params = useParams();
  const sellerIdSlug = typeof params.sellerId === 'string' ? params.sellerId : '';

  const { userProfileWithPermissions } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [relatedLots, setRelatedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [lotSortBy, setLotSortBy] = useState<string>('endDate_asc');
  const [currentLotPage, setCurrentLotPage] = useState(1);
  const [lotItemsPerPage, setLotItemsPerPage] = useState(6);

  const hasEditPermissions = useMemo(() => 
    hasAnyPermission(userProfileWithPermissions, ['manage_all', 'sellers:update']),
    [userProfileWithPermissions]
  );
  
  useEffect(() => {
    async function fetchSellerDetails() {
      if (sellerIdSlug) {
        setIsLoading(true);
        setError(null);
        try {
          const [foundSeller, auctions, allLots, settings] = await Promise.all([
              getSellerBySlug(sellerIdSlug),
              getAuctionsBySellerSlug(sellerIdSlug),
              getLots(),
              getPlatformSettings()
          ]);
          setPlatformSettings(settings);
          setLotItemsPerPage(settings.searchItemsPerPage || 6);
          setAllAuctions(auctions);

          if (!foundSeller) {
            setError(`Comitente com slug/publicId "${sellerIdSlug}" não encontrado.`);
            setSellerProfile(null);
            setRelatedLots([]);
            setIsLoading(false);
            return;
          }
          setSellerProfile(foundSeller);
          
          const lotsFromThisSeller = allLots.filter(lot => lot.sellerId === foundSeller.id || lot.sellerName === foundSeller.name);
          setRelatedLots(lotsFromThisSeller);

          setCurrentLotPage(1);

        } catch (e) {
          console.error("Error fetching seller data:", e);
          setError("Erro ao carregar dados do comitente.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Slug/PublicID do comitente não fornecido.");
        setIsLoading(false);
      }
    }
    fetchSellerDetails();
  }, [sellerIdSlug]);

  const sortedLots = useMemo(() => {
    let lotsToSort = [...relatedLots];
    switch (lotSortBy) {
        case 'endDate_asc':
          lotsToSort.sort((a, b) => new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime());
          break;
        case 'endDate_desc':
          lotsToSort.sort((a, b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime());
          break;
        case 'price_asc':
          lotsToSort.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          lotsToSort.sort((a, b) => b.price - a.price);
          break;
        case 'views_desc':
          lotsToSort.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        case 'relevance':
        default:
          break;
      }
      return lotsToSort;
  }, [relatedLots, lotSortBy]);

  const paginatedLots = useMemo(() => {
    if (!platformSettings) return [];
    const startIndex = (currentLotPage - 1) * lotItemsPerPage;
    const endIndex = startIndex + lotItemsPerPage;
    return sortedLots.slice(startIndex, endIndex);
  }, [sortedLots, currentLotPage, lotItemsPerPage, platformSettings]);

  const handleLotSortChange = (newSortBy: string) => {
    setLotSortBy(newSortBy);
    setCurrentLotPage(1);
  };

  const handleLotPageChange = (newPage: number) => {
    setCurrentLotPage(newPage);
  };
  
  const handleLotItemsPerPageChange = (newSize: number) => {
      setLotItemsPerPage(newSize);
      setCurrentLotPage(1);
  }

  const renderLotGridItemForSellerPage = (lot: Lot) => <LotCard key={lot.id} lot={lot} platformSettings={platformSettings!} auction={allAuctions.find(a => a.id === lot.auctionId)} />;
  const renderLotListItemForSellerPage = (lot: Lot) => <LotListItem key={lot.id} lot={lot} platformSettings={platformSettings!} auction={allAuctions.find(a => a.id === lot.auctionId)} />;


  if (isLoading || !platformSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }
  
  if (!sellerProfile) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-muted-foreground">Comitente não encontrado.</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  const sellerInitial = sellerProfile.name ? sellerProfile.name.charAt(0).toUpperCase() : 'S';
  const editUrl = `/admin/sellers/${sellerProfile.id}/edit`;

  return (
    <>
      <TooltipProvider>
        <div className="space-y-10 py-6">
          <section className="border-b pb-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-primary/30 shadow-lg">
                <AvatarImage src={sellerProfile.logoUrl || `https://placehold.co/128x128.png?text=${sellerInitial}`} alt={sellerProfile.name} data-ai-hint={sellerProfile.dataAiHintLogo || "logo comitente"} />
                <AvatarFallback className="text-4xl">{sellerInitial}</AvatarFallback>
              </Avatar>
              <div className="flex-grow text-center md:text-left">
                <h1 className="text-3xl font-bold font-headline">{sellerProfile.name}</h1>
                <p className="text-sm text-muted-foreground">{sellerProfile.city && sellerProfile.state ? `${sellerProfile.city} - ${sellerProfile.state}` : 'Localização não informada'}</p>
                {sellerProfile.rating !== undefined && sellerProfile.rating > 0 && (
                  <div className="flex items-center justify-center md:justify-start text-sm text-amber-600 mt-2">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500 mr-1" />
                    {sellerProfile.rating.toFixed(1)}
                    <span className="text-muted-foreground ml-2 text-xs">({sellerProfile.auctionsFacilitatedCount || 0} leilões)</span>
                  </div>
                )}
              </div>
               <Card className="shadow-none border-dashed p-4 min-w-[280px]">
                  <h4 className="text-sm font-semibold mb-2">Informações de Contato</h4>
                  <div className="space-y-1.5 text-xs">
                      {sellerProfile.phone && (<div className="flex items-center"><Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" /><a href={`tel:${sellerProfile.phone}`} className="hover:text-primary">{sellerProfile.phone}</a></div>)}
                      {sellerProfile.email && (<div className="flex items-center"><Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" /><a href={`mailto:${sellerProfile.email}`} className="hover:text-primary">{sellerProfile.email}</a></div>)}
                      {sellerProfile.website && (<div className="flex items-center"><Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" /><a href={sellerProfile.website.startsWith('http') ? sellerProfile.website : `https://${sellerProfile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{sellerProfile.website.replace(/^https?:\/\//, '')}</a></div>)}
                  </div>
              </Card>
            </div>
          </section>

          {relatedLots.length > 0 && (
            <section className="pt-6">
              <h2 className="text-2xl font-bold mb-6 font-headline flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-primary" /> Lotes Ativos de {sellerProfile.name}
              </h2>
              <SearchResultsFrame
                  items={paginatedLots}
                  totalItemsCount={relatedLots.length}
                  renderGridItem={renderLotGridItemForSellerPage}
                  renderListItem={renderLotListItemForSellerPage}
                  sortOptions={sortOptionsLots}
                  initialSortBy={lotSortBy}
                  onSortChange={handleLotSortChange}
                  platformSettings={platformSettings}
                  isLoading={isLoading}
                  searchTypeLabel="lotes"
                  currentPage={currentLotPage}
                  itemsPerPage={lotItemsPerPage}
                  onPageChange={handleLotPageChange}
                  onItemsPerPageChange={handleLotItemsPerPageChange}
              />
            </section>
          )}

          {relatedLots.length === 0 && !isLoading && (
            <Card className="shadow-sm mt-8"><CardContent className="text-center py-10"><p className="text-muted-foreground">Nenhum lote ativo encontrado para este comitente no momento.</p></CardContent></Card>
          )}
        </div>
      </TooltipProvider>

      {hasEditPermissions && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild className="fixed bottom-16 right-5 z-50 h-14 w-14 rounded-full shadow-lg" size="icon">
                <Link href={editUrl}>
                  <Pencil className="h-6 w-6" />
                  <span className="sr-only">Editar Comitente</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Editar Comitente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}

```
- src/app/sellers/page.tsx:
```tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, ArrowRight, CalendarDays, Star, PackageOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getSellers } from '@/app/admin/sellers/actions';
import type { SellerProfileInfo } from '@/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SellersListPage() {
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSellers() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedSellers = await getSellers();
        setSellers(fetchedSellers);
      } catch (e) {
        console.error("Error fetching sellers:", e);
        setError("Falha ao buscar comitentes.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSellers();
  }, []);

  const getSellerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'C';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
          <Building className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Comitentes</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça os vendedores e instituições que confiam no BidExpert para leiloar seus bens.
          </p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-lg animate-pulse">
              <CardHeader className="items-center text-center p-4">
                <div className="h-24 w-24 mb-3 rounded-full bg-muted"></div>
                <div className="h-6 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded mt-1"></div>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm text-muted-foreground">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <div className="h-9 w-full bg-muted rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <Building className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Comitentes</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Conheça os vendedores e instituições que confiam no BidExpert para leiloar seus bens.
        </p>
      </section>

      {sellers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum comitente cadastrado na plataforma ainda.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((seller) => (
          <Card key={seller.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="items-center text-center p-4">
              <Avatar className="h-24 w-24 mb-3 border-2 border-primary/30">
                <AvatarImage src={seller.logoUrl || `https://placehold.co/100x100.png?text=${getSellerInitial(seller.name)}`} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || "logo comitente"} />
                <AvatarFallback>{getSellerInitial(seller.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold">{seller.name}</CardTitle>
              <CardDescription className="text-xs text-primary">Comitente Verificado</CardDescription>
               {seller.rating !== undefined && seller.rating > 0 && (
                <div className="flex items-center text-xs text-amber-600 mt-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-1" />
                  {seller.rating.toFixed(1)} 
                  <span className="text-muted-foreground ml-1">({Math.floor(Math.random() * 100 + (seller.auctionsFacilitatedCount || 0))} avaliações)</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow px-4 pb-4 space-y-1 text-sm text-muted-foreground text-center">
              {seller.city && seller.state && (
                <p className="text-xs">{seller.city} - {seller.state}</p>
              )}
              <div className="text-xs">
                <span className="font-medium text-foreground">{seller.activeLotsCount || 0}</span> lotes ativos
              </div>
               {seller.memberSince && (
                <div className="text-xs">
                    Membro desde: {format(new Date(seller.memberSince), 'MM/yyyy', { locale: ptBR })}
                </div>
               )}
            </CardContent>
            <CardFooter className="p-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`}>
                  Ver Perfil e Lotes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

```
- next.config.ts:
```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      "https://*.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev"
    ],
    esmExternals: 'loose', // For libraries like Leaflet
  }
};

export default nextConfig;

```