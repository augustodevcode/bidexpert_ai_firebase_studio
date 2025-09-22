// src/app/auctions/[auctionId]/lots/[lotId]/lot-detail-client.tsx
/**
 * @fileoverview Componente principal do lado do cliente para a página de detalhes de um lote.
 * Este componente é responsável por renderizar todas as informações do lote,
 * gerenciar o estado da UI (como a imagem exibida na galeria), e orquestrar
 * a interatividade do usuário, como favoritar, compartilhar e navegar entre
 * as abas de descrição, especificações, perguntas e avaliações. Ele também
 * renderiza o painel de lances (`BiddingPanel`).
 */
'use client';

import type { Lot, Auction, BidInfo, Review, LotQuestion, SellerProfileInfo, PlatformSettings, AuctionStage, LotCategory, UserLotMaxBid } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
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
import { format, isPast, differenceInSeconds, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addRecentlyViewedId } from '@/lib/recently-viewed-store';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, slugify, getAuctionStatusColor, isValidImageUrl, getActiveStage, getLotPriceForStage } from '@/lib/ui-helpers';

import { getReviewsForLot, createReview, getQuestionsForLot, askQuestionOnLot, getActiveUserLotMaxBid, placeBidOnLot, generateWinningBidTermAction } from './actions';
import { checkHabilitationForAuctionAction } from '@/app/admin/habilitations/actions';

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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BiddingPanel from '@/components/auction/bidding-panel';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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
    if (!effectiveEndDate || !isValid(effectiveEndDate)) {
      setDisplayMessage(getAuctionStatusText(lotStatus));
      setTimeSegments(null);
      return;
    }

    const end = effectiveEndDate;

    const calculateTime = () => {
      const now = new Date();

      if (isPast(end) || lotStatus !== 'ABERTO_PARA_LANCES') {
        setDisplayMessage(getAuctionStatusText(lotStatus === 'ABERTO_PARA_LANCES' && isPast(end) ? 'ENCERRADO' : lotStatus));
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
    if (effectiveStartDate && isValid(effectiveStartDate)) {
      setFormattedStartDate(format(effectiveStartDate, 'dd/MM/yy HH:mm', { locale: ptBR }));
    }
    if (effectiveEndDate && isValid(effectiveEndDate)) {
      setFormattedEndDate(format(effectiveEndDate, 'dd/MM/yy HH:mm', { locale: ptBR }));
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
  allCategories: LotCategory[];
  allSellers: SellerProfileInfo[];
  auctioneer: AuctioneerProfileInfo | null;
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

const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'admin@bidexpert.com.br'.toLowerCase();

export default function LotDetailClientContent({
  lot: initialLot,
  auction,
  platformSettings,
  sellerName: initialSellerName,
  lotIndex,
  previousLotId,
  nextLotId,
  totalLotsInAuction,
  allCategories,
  allSellers,
  auctioneer,
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
  const [isHabilitadoForThisAuction, setIsHabilitadoForThisAuction] = useState(false);

  const checkHabilitationStatus = useCallback(async () => {
    if (userProfileWithPermissions?.id && auction.id) {
        const status = await checkHabilitationForAuctionAction(userProfileWithPermissions.id, auction.id);
        setIsHabilitadoForThisAuction(status);
    }
  }, [userProfileWithPermissions?.id, auction.id]);

  useEffect(() => {
    checkHabilitationStatus();
  }, [checkHabilitationStatus]);

  const handleHabilitacaoSuccess = () => {
    setIsHabilitadoForThisAuction(true);
  };

  const mentalTriggersGlobalSettings = platformSettings.mentalTriggerSettings || {};
  const sectionBadges = platformSettings.sectionBadgeVisibility?.lotDetail || {
      showStatusBadge: true,
      showDiscountBadge: true,
      showUrgencyTimer: true,
      showPopularityBadge: true,
      showHotBidBadge: true,
      showExclusiveBadge: true,
  };
  
  const hasEditPermissions = useMemo(() => 
    hasAnyPermission(userProfileWithPermissions, ['manage_all', 'lots:update']),
    [userProfileWithPermissions]
  );
  const editUrl = `/admin/lots/${lot.id}/edit`;
  
  const gallery = useMemo(() => {
    if (!lot) return [];
    
    // Check if we should inherit media from a Bem
    if (lot.inheritedMediaFromBemId && lot.bens && lot.bens.length > 0) {
        const sourceBem = lot.bens.find(b => b.id === lot.inheritedMediaFromBemId);
        if (sourceBem) {
            const bemImages = [sourceBem.imageUrl, ...(sourceBem.galleryImageUrls || [])]
                .filter(Boolean) as string[];
            if (bemImages.length > 0) return bemImages;
        }
    }
    
    // Fallback to lot's own images
    const mainImage = typeof lot.imageUrl === 'string' && lot.imageUrl.trim() !== '' ? [lot.imageUrl] : [];
    const galleryImages = (lot.galleryImageUrls || []).filter(url => typeof url === 'string' && url.trim() !== '');
    const combined = [...mainImage, ...galleryImages];
    const uniqueUrls = Array.from(new Set(combined.filter(Boolean)));
    return uniqueUrls.length > 0 ? uniqueUrls : ['https://placehold.co/800x600.png?text=Imagem+Indisponivel'];
  }, [lot]);

  const activeStage = useMemo(() => getActiveStage(auction?.auctionStages), [auction?.auctionStages]);
  const activeLotPrices = useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);
  
  const { effectiveLotEndDate, effectiveLotStartDate } = useMemo(() => {
    return getEffectiveLotEndDate(lot, auction);
  }, [lot, auction]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.href);
        setIsLotFavorite(isLotFavoriteInStorage(lot.id));
    }
    
    // Format the date here to avoid hydration mismatch
    if (auction.endDate && isValid(new Date(auction.endDate as string))) {
      setFormattedAuctionEndDate(format(new Date(auction.endDate as string), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    }
    
    if (lot?.id) {
      addRecentlyViewedId(lot.id);
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


  const lotTitle = `${lot?.year || ''} ${lot?.make || ''} ${lot?.model || ''} ${lot?.version || ''} ${lot?.title || ''}`.trim();
  const lotLocation = lot?.cityName && lot?.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot?.stateUf || lot?.cityName || 'Não informado';

  const isEffectivelySuperTestUser = userProfileWithPermissions?.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS;
  const hasAdminRights = userProfileWithPermissions && hasPermission(userProfileWithPermissions, 'manage_all');
  const isDocHabilitado = userProfileWithPermissions?.habilitationStatus === 'HABILITADO';

  const canUserReview = !!userProfileWithPermissions;
  const canUserAskQuestion = isEffectivelySuperTestUser || hasAdminRights || (userProfileWithPermissions && isDocHabilitado);

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

  const nextImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev + 1) % gallery.length : 0));
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  const actualLotNumber = lot.number || String(lot.id).replace(/\D/g,'');
  const displayLotPosition = lotIndex !== undefined && lotIndex !== -1 ? lotIndex + 1 : 'N/A';
  const displayTotalLots = totalLotsInAuction || auction.totalLots || 'N/A';
  const handleNewReview = async (rating: number, comment: string) => { return false; };
  const handleNewQuestion = async (questionText: string) => { return false; };

  const relatedLots = useMemo(() => {
    if (!auction || !auction.lots || !lot) return [];
    return auction.lots.filter(relatedLot => relatedLot.id !== lot.id).slice(0, platformSettings.relatedLotsCount || 5);
  }, [auction, lot, platformSettings.relatedLotsCount]);

  const isJudicialAuction = auction.auctionType === 'JUDICIAL';
  const currentLotHasProcessInfo = hasProcessInfo(lot);
  const showLegalProcessTab = isJudicialAuction && currentLotHasProcessInfo;
  const legalTabTitle = showLegalProcessTab ? "Documentos e Processo" : "Documentos";
  
  const auctioneerName = auction.auctioneer?.name || auction.auctioneerName;
  const getAuctioneerInitial = () => {
    if (auctioneerName && typeof auctioneerName === 'string') {
      return auctioneerName.charAt(0).toUpperCase();
    }
    return '?';
  };
  const auctioneerInitial = getAuctioneerInitial();

 if (!lot || !auction) return <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]"><Loader2 className="h-8 w-8 animate-spin text-primary"/><p className="ml-2 text-muted-foreground">Carregando detalhes do lote...</p></div>;

 return (
    <>
      <TooltipProvider>
        <div className="space-y-8" data-ai-id="lot-detail-page-container">
          <section className="space-y-4" data-ai-id="lot-detail-header-section">
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
                <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!previousLotId} disabled={!previousLotId} aria-label="Lote Anterior">{previousLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${previousLotId}`}><ChevronLeft className="h-4 w-4" /></Link> : <ChevronLeft className="h-4 w-4" />}</Button>
                <span className="text-sm text-muted-foreground mx-1">Lote {displayLotPosition} de {displayTotalLots}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!nextLotId} disabled={!nextLotId} aria-label="Próximo Lote">{nextLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${nextLotId}`}><ChevronRight className="h-4 w-4" /></Link> : <ChevronRight className="h-4 w-4" />}</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-6" data-ai-id="lot-detail-main-content-panel">
                <Card className="shadow-lg"><CardContent className="p-4"><div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden mb-4">{gallery.length > 0 && gallery[currentImageIndex] ? <Image src={gallery[currentImageIndex]} alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`} fill className="object-contain" data-ai-hint={lot.dataAiHint || "imagem principal lote"} priority={currentImageIndex === 0} unoptimized={gallery[currentImageIndex]?.startsWith('https://placehold.co')}/> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ImageOff className="h-16 w-16 mb-2" /><span>Imagem principal não disponível</span></div>}{platformSettings.showCountdownOnLotDetail !== false && (<DetailTimeRemaining effectiveEndDate={effectiveLotEndDate} effectiveStartDate={effectiveLotStartDate} lotStatus={lot.status} className="rounded-b-md" />)}{gallery.length > 1 && (<><Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Imagem Anterior"><ChevronLeft className="h-5 w-5" /></Button><Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Próxima Imagem"><ChevronRight className="h-5 w-5" /></Button></>)}</div>{gallery.length > 1 && (<div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">{gallery.map((url, index) => (<button key={index} className={`relative aspect-square bg-muted rounded-sm overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`} onClick={() => setCurrentImageIndex(index)} aria-label={`Ver imagem ${index + 1}`}><Image src={url} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem galeria carro'} unoptimized={url.startsWith('https://placehold.co')}/></button>))}</div>)}{gallery.length === 0 && (<p className="text-sm text-center text-muted-foreground py-4">Nenhuma imagem na galeria.</p>)}<div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">{lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}<span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary"/> Localização: {lotLocation}</span></div></CardContent></Card>
                <Card id="auction-details-section" className="shadow-lg"><CardHeader><CardTitle className="text-xl font-semibold flex items-center"><Gavel className="h-5 w-5 mr-2 text-muted-foreground" />Informações do Leilão</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0"><div className="flex items-start gap-4">{auctioneer?.logoUrl && (<Avatar className="h-16 w-16 border-2 border-primary/20 flex-shrink-0"><AvatarImage src={auctioneer.logoUrl} alt={auctioneerName || ''} data-ai-hint={auctioneer.dataAiHintLogo || 'logo leiloeiro'} /><AvatarFallback>{auctioneerInitial}</AvatarFallback></Avatar>)}<div className="flex-grow"><Link href={`/auctions/${auction.publicId || auction.id}`} className="hover:text-primary"><p className="font-bold text-lg text-foreground">{auction.title}</p></Link><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 text-sm"><div className="flex items-center text-muted-foreground"><UserCircle className="h-4 w-4 mr-2" /><span>Leiloeiro: <span className="font-medium text-foreground">{auctioneerName}</span></span></div><div className="flex items-center text-muted-foreground"><Tag className="h-4 w-4 mr-2" /><span>Categoria: <span className="font-medium text-foreground">{auction.category?.name || 'Não informada'}</span></span></div><div className="flex items-center text-muted-foreground"><Gavel className="h-4 w-4 mr-2" /><span>Modalidade: <span className="font-medium text-foreground">{auction.auctionType || 'Não especificada'}</span></span></div><div className="flex items-center text-muted-foreground"><Info className="h-4 w-4 mr-2" /><span>Status:<Badge variant="outline" className={`ml-2 text-xs ${getAuctionStatusColor(auction.status)} border-current`}>{getAuctionStatusText(auction.status)}</Badge></span></div>{auction.endDate && (<div className="flex items-center text-muted-foreground"><CalendarDays className="h-4 w-4 mr-2" /><span>Fim: <span className="font-medium text-foreground">{formattedAuctionEndDate || '...'}</span></span></div>)}</div></div></div></CardContent><CardFooter className="p-4 md:p-6 pt-0"><Button asChild variant="outline" size="sm"><Link href={`/auctions/${auction.publicId || auction.id}`}>Ver todos os lotes do leilão <ChevronRight className="h-4 w-4 ml-2" /></Link></Button></CardFooter></Card>
                <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-semibold flex items-center"><FileText className="h-5 w-5 mr-2 text-muted-foreground" />Detalhes do Lote</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0"><Tabs defaultValue="description" className="w-full"><TabsList className="flex w-full flex-wrap gap-1 mb-4"><TabsTrigger value="description">Descrição</TabsTrigger><TabsTrigger value="specification">Especificações</TabsTrigger><TabsTrigger value="legal">{legalTabTitle}</TabsTrigger><TabsTrigger value="seller">Comitente</TabsTrigger><TabsTrigger value="reviews">Avaliações</TabsTrigger><TabsTrigger value="questions">Perguntas</TabsTrigger></TabsList><TabsContent value="description"><LotDescriptionTab lot={lot} /></TabsContent><TabsContent value="specification"><LotSpecificationTab lot={lot} /></TabsContent><TabsContent value="legal"><Card className="shadow-none border-0"><CardHeader className="px-1 pt-0"><CardTitle className="text-xl font-semibold flex items-center"><FileText className="h-5 w-5 mr-2 text-muted-foreground" /> {legalTabTitle}</CardTitle></CardHeader><CardContent className="px-1 space-y-2 text-sm">{showLegalProcessTab && (<>{lot.judicialProcessNumber && <p><strong className="text-foreground">Nº Processo Judicial:</strong> <span className="text-muted-foreground">{lot.judicialProcessNumber}</span></p>}{lot.courtDistrict && <p><strong className="text-foreground">Comarca:</strong> <span className="text-muted-foreground">{lot.courtDistrict}</span></p>}{lot.courtName && <p><strong className="text-foreground">Vara:</strong> <span className="text-muted-foreground">{lot.courtName}</span></p>}{lot.publicProcessUrl && <p><strong className="text-foreground">Consulta Pública:</strong> <a href={lot.publicProcessUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Acessar Processo <LinkIcon className="h-3 w-3"/></a></p>}{lot.propertyRegistrationNumber && <p><strong className="text-foreground">Matrícula do Imóvel:</strong> <span className="text-muted-foreground">{lot.propertyRegistrationNumber}</span></p>}{lot.propertyLiens && <p><strong className="text-foreground">Ônus/Gravames:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.propertyLiens}</span></p>}{lot.knownDebts && <p><strong className="text-foreground">Dívidas Conhecidas:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.knownDebts}</span></p>}{lot.additionalDocumentsInfo && <p><strong className="text-foreground">Outras Informações/Links de Documentos:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.additionalDocumentsInfo}</span></p>}<Separator className="my-3" /></>)}{auction.documentsUrl && <p><strong className="text-foreground">Edital do Leilão:</strong> <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Ver Edital Completo <FileText className="h-3 w-3"/></a></p>}{!auction.documentsUrl && !showLegalProcessTab && (<p className="text-muted-foreground">Nenhuma informação legal ou documental adicional fornecida para este lote.</p>)}{auction.documentsUrl && !showLegalProcessTab && !currentLotHasProcessInfo && (<p className="text-muted-foreground mt-2 text-xs">Outras informações processuais específicas deste lote não foram fornecidas.</p>)}</CardContent></Card></TabsContent><TabsContent value="seller"><LotSellerTab sellerName={initialSellerName || auction.seller?.name || "Não Informado"} sellerId={lot.sellerId} auctionSellerName={auction.seller?.name} /></TabsContent><TabsContent value="reviews"><LotReviewsTab lot={lot} reviews={lotReviews} isLoading={isLoadingData} onNewReview={handleNewReview} canUserReview={canUserReview} /></TabsContent><TabsContent value="questions"><LotQuestionsTab lot={lot} questions={lotQuestions} isLoading={isLoadingData} onNewQuestion={handleNewQuestion} canUserAskQuestion={canUserAskQuestion} /></TabsContent></Tabs></CardContent></Card>
              </div>
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 self-start" data-ai-id="lot-detail-sidebar">
                  <BiddingPanel 
                    currentLot={lot} 
                    auction={auction} 
                    onBidSuccess={handleBidSuccess}
                    isHabilitadoForThisAuction={isHabilitadoForThisAuction}
                    onHabilitacaoSuccess={handleHabilitacaoSuccess}
                    activeStage={activeStage}
                    activeLotPrices={activeLotPrices}
                  />
                  <Card className="shadow-md"><CardHeader><CardTitle className="text-lg font-semibold flex items-center"><Scale className="h-5 w-5 mr-2 text-muted-foreground"/>Valores e Condições Legais</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{activeLotPrices?.initialBid && <div className="flex justify-between"><span className="text-muted-foreground">Lance Inicial ({activeStage?.name || 'Etapa'}):</span> <span className="font-semibold text-foreground">R$ {activeLotPrices.initialBid.toLocaleString('pt-BR')}</span></div>}{lot.reservePrice && <div className="flex justify-between"><span className="text-muted-foreground">Preço de Reserva:</span> <span className="font-semibold text-foreground">(Confidencial)</span></div>}{lot.debtAmount && <div className="flex justify-between"><span className="text-muted-foreground">Montante da Dívida:</span> <span className="font-semibold text-foreground">R$ {lot.debtAmount.toLocaleString('pt-BR')}</span></div>}{lot.itbiValue && <div className="flex justify-between"><span className="text-muted-foreground">Valor de ITBI:</span> <span className="font-semibold text-foreground">R$ {lot.itbiValue.toLocaleString('pt-BR')}</span></div>}{!activeLotPrices?.initialBid && !lot.reservePrice && !lot.debtAmount && !lot.itbiValue && <p className="text-muted-foreground text-center text-xs py-2">Nenhuma condição de valor especial para este lote.</p>}</CardContent></Card>
                  <LotMapDisplay lot={lot} platformSettings={platformSettings} onOpenMapModal={() => setIsMapModalOpen(true)} />
              </div>
            </div>
          </section>
          
          {platformSettings.showRelatedLotsOnLotDetail !== false && relatedLots.length > 0 && (
            <section className="pt-8 border-t" data-ai-id="lot-detail-related-lots-section">
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
      <LotMapPreviewModal lot={lot} platformSettings={platformSettings!} isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} />
    </>
    );
}
