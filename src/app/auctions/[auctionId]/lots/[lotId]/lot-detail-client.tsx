
'use client';

import type { Lot, Auction, BidInfo, Review, LotQuestion, SellerProfileInfo, PlatformSettings, AuctionStage } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, Key, Info,
    Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, ThumbsUp,
    ShieldCheck, HelpCircle, ShoppingCart, Heart, X, Facebook, Mail, MessageSquareText, Gavel, ImageOff, Loader2, FileText, ThumbsDown, MessageCircle, Send, Eye, ExternalLink, ListFilter, FileQuestion, Banknote, Building, Link2 as LinkIcon, AlertCircle, Percent, Zap, TrendingUp, Crown
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
import { getAuctionStatusText, getLotStatusColor, sampleAuctions, samplePlatformSettings } from '@/lib/sample-data';

import { getBidsForLot, getReviewsForLot, createReview, getQuestionsForLot, askQuestionOnLot, placeBidOnLot } from './actions';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotDescriptionTab from '@/components/auction/lot-description-tab';
import LotSpecificationTab from '@/components/auction/lot-specification-tab';
import LotSellerTab from '@/components/auction/lot-seller-tab';
import LotReviewsTab from '@/components/auction/lot-reviews-tab';
import LotQuestionsTab from '@/components/auction/lot-questions-tab';
import LotMapDisplay from '@/components/auction/lot-map-display';
import LotPreviewModal from '@/components/lot-preview-modal';
import { hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import LotAllBidsModal from '@/components/auction/lot-all-bids-modal';
import LotCard from '@/components/lot-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'admin@bidexpert.com.br'.toLowerCase();
const SUPER_TEST_USER_UID_FOR_BYPASS = 'SUPER_TEST_USER_UID_PLACEHOLDER_AUG';
const SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS = 'Administrador BidExpert (Super Test)';


interface DetailTimeRemainingProps {
  effectiveEndDate: Date | null;
  effectiveStartDate?: Date | null;
  lotStatus: Lot['status'];
  showUrgencyTimer?: boolean;
  urgencyThresholdDays?: number;
  urgencyThresholdHours?: number;
  className?: string;
}

const DetailTimeRemaining: React.FC<DetailTimeRemainingProps> = ({
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


  return (
    <div className={cn("text-center py-3 bg-secondary/30 rounded-md shadow-inner", className)}>
      {timeSegments && lotStatus === 'ABERTO_PARA_LANCES' && effectiveEndDate && !isPast(new Date(effectiveEndDate)) ? (
        <>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Encerra em:</p>
          <div className="flex justify-center items-baseline space-x-2 text-destructive">
            {parseInt(timeSegments.days, 10) > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{timeSegments.days}</span>
                <span className="text-xs uppercase">dias</span>
              </div>
            )}
            {parseInt(timeSegments.days, 10) > 0 && <span className="text-2xl font-light self-center pb-1">|</span>}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{timeSegments.hours}</span>
              <span className="text-xs uppercase">horas</span>
            </div>
            <span className="text-2xl font-light self-center pb-1">|</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{timeSegments.minutes}</span>
              <span className="text-xs uppercase">minutos</span>
            </div>
            {parseInt(timeSegments.days, 10) === 0 && (
              <>
                <span className="text-2xl font-light self-center pb-1">|</span>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">{timeSegments.seconds}</span>
                  <span className="text-xs uppercase">segs</span>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="text-lg font-semibold text-muted-foreground">{displayMessage}</div>
      )}
       <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-x-2 px-2">
        {effectiveStartDate && (
           <div className="text-right">
             <span className="font-medium">Abertura:</span> {format(new Date(effectiveStartDate), 'dd/MM/yy HH:mm', {locale: ptBR})}
           </div>
        )}
        {effectiveEndDate && (
           <div className="text-left">
             <span className="font-medium">Encerramento:</span> {format(new Date(effectiveEndDate), 'dd/MM/yy HH:mm', {locale: ptBR})}
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
  const [lotBids, setLotBids] = useState<BidInfo[]>([]);
  const [lotReviews, setLotReviews] = useState<Review[]>([]);
  const [lotQuestions, setLotQuestions] = useState<LotQuestion[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmountInput, setBidAmountInput] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isAllBidsModalOpen, setIsAllBidsModalOpen] = useState(false);

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

    if (!finalEndDate && auction.endDate) {
        finalEndDate = new Date(auction.endDate as string);
    }
    if (!finalStartDate && auction.auctionDate) {
        finalStartDate = new Date(auction.auctionDate as string);
    }

    if (!finalEndDate && lot.endDate) {
        finalEndDate = new Date(lot.endDate as string);
         console.warn(`[LotDetailClient] Usando endDate do LOTE como fallback para lote ${lot.id}`);
    }
     if (!finalStartDate && lot.auctionDate) {
        finalStartDate = new Date(lot.auctionDate as string);
    }


    return { effectiveLotEndDate: finalEndDate, effectiveLotStartDate: finalStartDate };
  }, [lot, auction]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
    if (lot?.id) {
      addRecentlyViewedId(lot.id);
      setIsLotFavorite(isLotFavoriteInStorage(lot.id));
      setCurrentImageIndex(0);

      const fetchDataForTabs = async () => {
        setIsLoadingData(true);
        try {
          console.log(`[LotDetailClient] Fetching tab data for lot ID: ${lot.id}`);
          const [bids, reviews, questions] = await Promise.all([
            getBidsForLot(lot.id),
            getReviewsForLot(lot.id),
            getQuestionsForLot(lot.id)
          ]);
          console.log(`[LotDetailClient] Bids fetched: ${bids.length}, Reviews: ${reviews.length}, Questions: ${questions.length}`);
          setLotBids(bids.sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime()));
          setLotReviews(reviews);
          setLotQuestions(questions);
        } catch (error: any) {
          console.error("[LotDetailClient] Error fetching data for tabs:", error);
          toast({ title: "Erro", description: "Não foi possível carregar todos os dados do lote.", variant: "destructive" });
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchDataForTabs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lot?.id, toast]);


  const lotTitle = `${lot?.year || ''} ${lot?.make || ''} ${lot?.model || ''} ${lot?.series || lot?.title}`.trim();
  const lotLocation = lot?.cityName && lot?.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot?.stateUf || lot?.cityName || 'Não informado';

  const isEffectivelySuperTestUser = userProfileWithPermissions?.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS;
  const hasAdminRights = userProfileWithPermissions && hasPermission(userProfileWithPermissions, 'manage_all');
  const isUserHabilitado = userProfileWithPermissions?.habilitationStatus === 'HABILITADO';

  const canUserBid =
    (isEffectivelySuperTestUser || hasAdminRights || (userProfileWithPermissions && isUserHabilitado)) &&
    lot?.status === 'ABERTO_PARA_LANCES';

  const canUserReview = !!userProfileWithPermissions;

  const canUserAskQuestion =
    isEffectivelySuperTestUser || hasAdminRights || (userProfileWithPermissions && isUserHabilitado);

  const handleToggleFavorite = () => {
    if (!lot || !lot.id) return;
    const newFavoriteState = !isLotFavorite;
    setIsLotFavorite(newFavoriteState);

    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id);
    } else {
      removeFavoriteLotIdFromStorage(lot.id);
    }

    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lotTitle}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };

  const bidIncrement = lot?.bidIncrementStep || ((lot?.price || 0) > 10000 ? 500 : ((lot?.price || 0) > 1000 ? 100 : 50));
  const nextMinimumBid = (lot?.price || 0) + bidIncrement;

  const handlePlaceBid = async () => {
    setIsPlacingBid(true);

    let userIdForBid: string | undefined = userProfileWithPermissions?.uid;
    let displayNameForBid: string | undefined = userProfileWithPermissions?.fullName || userProfileWithPermissions?.email?.split('@')[0];

    if (isEffectivelySuperTestUser && !userIdForBid) {
        userIdForBid = userProfileWithPermissions?.uid || SUPER_TEST_USER_UID_FOR_BYPASS;
        displayNameForBid = userProfileWithPermissions?.fullName || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
    }

    if (!userIdForBid) {
      toast({ title: "Ação Requerida", description: "Você precisa estar logado e com perfil carregado para dar um lance.", variant: "destructive" });
      setIsPlacingBid(false);
      return;
    }
    if (!displayNameForBid) displayNameForBid = 'Usuário Anônimo';

    const amountToBid = parseFloat(bidAmountInput);
    if (isNaN(amountToBid) || amountToBid <= 0) {
      toast({ title: "Erro no Lance", description: "Por favor, insira um valor de lance válido.", variant: "destructive" });
      setIsPlacingBid(false);
      return;
    }
    if (amountToBid < nextMinimumBid) {
        toast({ title: "Erro no Lance", description: `Seu lance deve ser de pelo menos R$ ${nextMinimumBid.toLocaleString('pt-BR')}.`, variant: "destructive" });
        setIsPlacingBid(false);
        return;
    }

    try {
      console.log(`[LotDetailClient] Placing bid for lot ${lot.id} by user ${userIdForBid} with amount ${amountToBid}`);
      const result = await placeBidOnLot(lot.id, lot.auctionId, userIdForBid!, displayNameForBid!, amountToBid);
      console.log(`[LotDetailClient] placeBidOnLot result:`, result);

      if (result.success && result.updatedLot && result.newBid) {
        setLot(prevLot => ({ ...prevLot!, ...result.updatedLot }));
        setLotBids(prevBids => [result.newBid!, ...prevBids].sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime()));
        setBidAmountInput('');
        toast({ title: "Lance Enviado!", description: result.message });
      } else {
        toast({ title: "Erro ao Dar Lance", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro Inesperado", description: error.message || "Ocorreu um erro ao processar seu lance.", variant: "destructive" });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const currentBidLabel = lot?.bidsCount && lot.bidsCount > 0 ? "Último lance:" : "Lance Inicial:";
  const currentBidValue = lot?.price || 0;

  const mentalTriggersGlobalSettings = platformSettings.mentalTriggerSettings || {};
  const sectionBadgesLotDetail = platformSettings.sectionBadgeVisibility?.lotDetail || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  };

  const discountPercentageLotDetail = useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE')) {
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);

  const mentalTriggersLotDetail = useMemo(() => {
    let triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    const settings = mentalTriggersGlobalSettings;

    if (sectionBadgesLotDetail.showPopularityBadge !== false && settings.showPopularityBadge && (lot.views || 0) > (settings.popularityViewThreshold || 500)) {
      triggers.push('MAIS VISITADO');
    }
    if (sectionBadgesLotDetail.showHotBidBadge !== false && settings.showHotBidBadge && (lot.bidsCount || 0) > (settings.hotBidThreshold || 10) && lot.status === 'ABERTO_PARA_LANCES') {
      triggers.push('LANCE QUENTE');
    }
    if (sectionBadgesLotDetail.showExclusiveBadge !== false && settings.showExclusiveBadge && lot.isExclusive) {
        triggers.push('EXCLUSIVO');
    }
    return Array.from(new Set(triggers));
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings, sectionBadgesLotDetail]);


  if (!lot || !auction) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        <p className="ml-2 text-muted-foreground">Carregando detalhes do lote...</p>
      </div>
    );
  }

  const nextImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev + 1) % gallery.length : 0));
  const prevImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev - 1 + gallery.length) % gallery.length : 0));

  const actualLotNumber = lot.number || lot.id;
  const displayLotPosition = lotIndex !== undefined && lotIndex !== -1 ? lotIndex + 1 : 'N/A';
  const displayTotalLots = totalLotsInAuction || auction.totalLots || 'N/A';

  const handleNewReview = async (rating: number, comment: string) => {
    let userIdForReview: string | undefined = userProfileWithPermissions?.uid;
    let displayNameForReview: string | undefined = userProfileWithPermissions?.fullName || userProfileWithPermissions?.email?.split('@')[0];

    if (isEffectivelySuperTestUser && !userIdForReview) {
        userIdForReview = userProfileWithPermissions?.uid || SUPER_TEST_USER_UID_FOR_BYPASS;
        displayNameForReview = userProfileWithPermissions?.fullName || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
    }

    if (!userIdForReview) {
      toast({ title: "Login Necessário", description: "Você precisa estar logado para enviar uma avaliação.", variant: "destructive" });
      return false;
    }
    if (!displayNameForReview) displayNameForReview = 'Usuário Anônimo';

    console.log(`[LotDetailClient] Submitting review for lot ${lot.id} by user ${userIdForReview}`);
    const result = await createReview(lot.id, userIdForReview, displayNameForReview, rating, comment);
    console.log(`[LotDetailClient] createReview result:`, result);

    if (result.success) {
      toast({ title: "Avaliação Enviada", description: result.message });
      const updatedReviews = await getReviewsForLot(lot.id);
      setLotReviews(updatedReviews);
      return true;
    } else {
      toast({ title: "Erro ao Enviar Avaliação", description: result.message, variant: "destructive" });
      return false;
    }
  };

  const handleNewQuestion = async (questionText: string) => {
    let userIdForQuestion: string | undefined = userProfileWithPermissions?.uid;
    let displayNameForQuestion: string | undefined = userProfileWithPermissions?.fullName || userProfileWithPermissions?.email?.split('@')[0];

    if (isEffectivelySuperTestUser && !userIdForQuestion) {
        userIdForQuestion = userProfileWithPermissions?.uid || SUPER_TEST_USER_UID_FOR_BYPASS;
        displayNameForQuestion = userProfileWithPermissions?.fullName || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
    }

    if (!userIdForQuestion) {
      toast({ title: "Login Necessário", description: "Você precisa estar logado para enviar uma pergunta.", variant: "destructive" });
      return false;
    }
     if (!isUserHabilitado && !hasAdminRights && !isEffectivelySuperTestUser) {
      toast({ title: "Habilitação Necessária", description: "Você precisa estar habilitado para fazer perguntas.", variant: "destructive" });
      return false;
    }
    if (!displayNameForQuestion) displayNameForQuestion = 'Usuário Anônimo';

    console.log(`[LotDetailClient] Submitting question for lot ${lot.id} by user ${userIdForQuestion}`);
    const result = await askQuestionOnLot(lot.id, userIdForQuestion, displayNameForQuestion, questionText);
    console.log(`[LotDetailClient] askQuestionOnLot result:`, result);

    if (result.success) {
      toast({ title: "Pergunta Enviada", description: result.message });
      const updatedQuestions = await getQuestionsForLot(lot.id);
      setLotQuestions(updatedQuestions);
      return true;
    } else {
      toast({ title: "Erro ao Enviar Pergunta", description: result.message, variant: "destructive" });
      return false;
    }
  };

  const relatedLots = useMemo(() => {
    if (!auction || !auction.lots || !lot) return [];
    return auction.lots
      .filter(relatedLot => relatedLot.id !== lot.id)
      .slice(0, platformSettings.relatedLotsCount || 5);
  }, [auction, lot, platformSettings.relatedLotsCount]);

  const isJudicialAuction = auction.auctionType === 'JUDICIAL';
  const currentLotHasProcessInfo = hasProcessInfo(lot);
  const showLegalProcessTab = isJudicialAuction && currentLotHasProcessInfo;

  const legalTabTitle = showLegalProcessTab ? "Documentos e Processo" : "Documentos";

 return (
    <>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
            <div className="flex-grow">
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-left">{lotTitle}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs px-2 py-0.5 ${getLotStatusColor(lot.status)}`}>
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                </div>
            </div>
            <div className="flex items-center space-x-2 flex-wrap justify-start sm:justify-end mt-2 sm:mt-0">
                <Button variant="outline" size="icon" onClick={handlePrint} aria-label="Imprimir"><Printer className="h-4 w-4" /></Button>
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

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">Lote Nº: {actualLotNumber}</span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!previousLotId} disabled={!previousLotId} aria-label="Lote Anterior">{previousLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${previousLotId}`}><ChevronLeft className="h-4 w-4" /></Link> : <ChevronLeft className="h-4 w-4"/>}</Button>
                    <span className="text-sm text-muted-foreground mx-1">Lote {displayLotPosition} de {displayTotalLots}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!nextLotId} disabled={!nextLotId} aria-label="Próximo Lote">{nextLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${nextLotId}`}><ChevronRight className="h-4 w-4" /></Link> : <ChevronRight className="h-4 w-4" />}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-lg">
                    <CardContent className="p-4">
                        <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden mb-4">
                        {gallery.length > 0 && gallery[currentImageIndex] ? (
                            <Image src={gallery[currentImageIndex]} alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`} fill className="object-contain" data-ai-hint={lot.dataAiHint || "imagem principal lote"} priority={currentImageIndex === 0} unoptimized={gallery[currentImageIndex]?.startsWith('https://placehold.co')}/>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ImageOff className="h-16 w-16 mb-2" /><span>Imagem principal não disponível</span></div>
                        )}
                        {gallery.length > 1 && (
                            <><Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Imagem Anterior"><ChevronLeft className="h-5 w-5" /></Button>
                            <Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Próxima Imagem"><ChevronRight className="h-5 w-5" /></Button></>
                        )}
                        </div>
                        {gallery.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                            {gallery.map((url, index) => (<button key={index} className={`relative aspect-square bg-muted rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`} onClick={() => setCurrentImageIndex(index)} aria-label={`Ver imagem ${index + 1}`}><Image src={url} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem galeria carro'} unoptimized={url.startsWith('https://placehold.co')}/></button>))}
                        </div>
                        )}
                        {gallery.length === 0 && (<p className="text-sm text-center text-muted-foreground py-4">Nenhuma imagem na galeria.</p>)}
                        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                        {lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}
                        <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary"/> Localização: {lotLocation}</span>
                        </div>
                    </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardContent className="p-4 md:p-6">
                            <Tabs defaultValue="description" className="w-full">
                                <TabsList className="flex w-full flex-wrap gap-1 mb-4">
                                    <TabsTrigger value="description">Descrição</TabsTrigger>
                                    <TabsTrigger value="specification">Especificações</TabsTrigger>
                                    <TabsTrigger value="legal">{legalTabTitle}</TabsTrigger>
                                    <TabsTrigger value="seller">Comitente</TabsTrigger>
                                    <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                                    <TabsTrigger value="questions">Perguntas</TabsTrigger>
                                </TabsList>
                                <TabsContent value="description"><LotDescriptionTab lot={lot} /></TabsContent>
                                <TabsContent value="specification"><LotSpecificationTab lot={lot} /></TabsContent>
                                <TabsContent value="legal">
                                    <Card className="shadow-none border-0">
                                        <CardHeader className="px-1 pt-0">
                                            <CardTitle className="text-xl font-semibold flex items-center">
                                                <FileText className="h-5 w-5 mr-2 text-muted-foreground" /> {legalTabTitle}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-1 space-y-2 text-sm">
                                            {showLegalProcessTab && (
                                                <>
                                                    {lot.judicialProcessNumber && <p><strong className="text-foreground">Nº Processo Judicial:</strong> <span className="text-muted-foreground">{lot.judicialProcessNumber}</span></p>}
                                                    {lot.courtDistrict && <p><strong className="text-foreground">Comarca:</strong> <span className="text-muted-foreground">{lot.courtDistrict}</span></p>}
                                                    {lot.courtName && <p><strong className="text-foreground">Vara:</strong> <span className="text-muted-foreground">{lot.courtName}</span></p>}
                                                    {lot.publicProcessUrl && <p><strong className="text-foreground">Consulta Pública:</strong> <a href={lot.publicProcessUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Acessar Processo <LinkIcon className="h-3 w-3"/></a></p>}
                                                    {lot.propertyRegistrationNumber && <p><strong className="text-foreground">Matrícula do Imóvel:</strong> <span className="text-muted-foreground">{lot.propertyRegistrationNumber}</span></p>}
                                                    {lot.propertyLiens && <p><strong className="text-foreground">Ônus/Gravames:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.propertyLiens}</span></p>}
                                                    {lot.knownDebts && <p><strong className="text-foreground">Dívidas Conhecidas:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.knownDebts}</span></p>}
                                                    {lot.additionalDocumentsInfo && <p><strong className="text-foreground">Outros Documentos/Obs:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.additionalDocumentsInfo}</span></p>}
                                                    <Separator className="my-3" />
                                                </>
                                            )}
                                            {auction.documentsUrl && <p><strong className="text-foreground">Edital do Leilão:</strong> <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Ver Edital Completo <FileText className="h-3 w-3"/></a></p>}
                                            
                                            {!auction.documentsUrl && !showLegalProcessTab && (
                                                <p className="text-muted-foreground">Nenhuma informação legal ou documental adicional fornecida para este lote.</p>
                                            )}
                                             {auction.documentsUrl && !showLegalProcessTab && !currentLotHasProcessInfo && (
                                                <p className="text-muted-foreground mt-2 text-xs">Outras informações processuais específicas deste lote não foram fornecidas.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="seller"><LotSellerTab sellerName={initialSellerName || auction.seller || "Não Informado"} sellerId={lot.sellerId} auctionSellerName={auction.seller} /></TabsContent>
                                <TabsContent value="reviews"><LotReviewsTab lot={lot} reviews={lotReviews} isLoading={isLoadingData} onNewReview={handleNewReview} canUserReview={canUserReview} /></TabsContent>
                                <TabsContent value="questions"><LotQuestionsTab lot={lot} questions={lotQuestions} isLoading={isLoadingData} onNewQuestion={handleNewQuestion} canUserAskQuestion={canUserAskQuestion} /></TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    <Card className="shadow-md">
                        <CardContent className="p-4 space-y-3">
                            {platformSettings.showCountdownOnLotDetail !== false && (
                                <DetailTimeRemaining
                                    effectiveEndDate={effectiveLotEndDate}
                                    effectiveStartDate={effectiveLotStartDate}
                                    lotStatus={lot.status}
                                    showUrgencyTimer={sectionBadgesLotDetail.showUrgencyTimer !== false && mentalTriggersGlobalSettings.showUrgencyTimer}
                                    urgencyThresholdDays={mentalTriggersGlobalSettings.urgencyTimerThresholdDays}
                                    urgencyThresholdHours={mentalTriggersGlobalSettings.urgencyTimerThresholdHours}
                                />
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Visitas: {lot.views}</span>
                                <span className="text-muted-foreground">Participantes: {auction.totalHabilitatedUsers || 0}</span>
                                <span className="text-muted-foreground">Lances: {lot.bidsCount || 0}</span>
                            </div>
                            <Separator />
                            <div className="text-sm">
                                <p className="text-muted-foreground">{currentBidLabel}</p>
                                <p className="text-3xl font-bold text-primary">
                                    R$ {currentBidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-muted-foreground">(BRL)</p>
                                {lot.initialPrice && lot.price > lot.initialPrice && (
                                  <p className="text-xs text-muted-foreground">
                                    Lance Inicial: <span className="line-through">R$ {lot.initialPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Incremento Mínimo: <span className="font-semibold text-foreground">R$ {bidIncrement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </p>
                            </div>

                            <div className="space-y-2 pt-2">
                                {sectionBadgesLotDetail.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentageLotDetail > 0 && (
                                    <Badge variant="destructive" className="text-sm px-2 py-1 w-full justify-center animate-pulse">
                                        <Percent className="h-4 w-4 mr-1.5" /> {discountPercentageLotDetail}% DE DESCONTO AGORA!
                                    </Badge>
                                )}
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {mentalTriggersLotDetail.map(trigger => (
                                        <Badge key={trigger} variant="secondary" className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                                            {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3.5 w-3.5 mr-1" />}
                                            {trigger === 'LANCE QUENTE' && <Zap className="h-3.5 w-3.5 mr-1 text-red-500 fill-red-500" />}
                                            {trigger === 'EXCLUSIVO' && <Crown className="h-3.5 w-3.5 mr-1 text-purple-600" />}
                                            {trigger}
                                        </Badge>
                                    ))}
                                </div>
                                {(lot.allowInstallmentBids || auction.allowInstallmentBids) && (
                                    <div className="flex items-center justify-center text-xs text-green-600 bg-green-100 border border-green-300 p-1.5 rounded-md">
                                        <Banknote className="h-4 w-4 mr-1.5" />
                                        Permite Lance Parcelado (Consulte Condições)
                                    </div>
                                )}
                            </div>


                            {canUserBid ? (
                            <div className="space-y-2 pt-2">
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input type="number" placeholder={`Próximo lance R$ ${nextMinimumBid.toLocaleString('pt-BR')}`} value={bidAmountInput} onChange={(e) => setBidAmountInput(e.target.value)} className="pl-9 h-11 text-base" min={nextMinimumBid} step={bidIncrement} disabled={isPlacingBid} />
                                    <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-primary" onClick={() => setBidAmountInput(String(nextMinimumBid))}>+</Button>
                                </div>
                                 <p className="text-xs text-muted-foreground text-center">Incremento: R$ {bidIncrement.toLocaleString('pt-BR')}</p>
                                <Button onClick={handlePlaceBid} disabled={isPlacingBid || !bidAmountInput} className="w-full h-11 text-base bg-accent text-accent-foreground hover:bg-accent/90">
                                {isPlacingBid ? <Loader2 className="animate-spin" /> : `Dar Lance (R$ ${parseFloat(bidAmountInput || '0').toLocaleString('pt-BR') || nextMinimumBid.toLocaleString('pt-BR') })`}
                                </Button>
                                <Button variant="link" size="sm" className="w-full text-primary text-xs">Estimar comissões e demais valores</Button>
                                <div className="flex items-center space-x-2 justify-center pt-2">
                                    <Switch id="quick-bid" disabled />
                                    <Label htmlFor="quick-bid" className="text-xs text-muted-foreground">Habilitar lance rápido</Label>
                                </div>
                            </div>
                            ) : (
                            <div className="text-sm text-center p-3 bg-destructive/10 text-destructive rounded-md">
                                <p>{lot.status !== 'ABERTO_PARA_LANCES' ? `Lances para este lote estão ${getAuctionStatusText(lot.status).toLowerCase()}.` : (userProfileWithPermissions ? 'Para ver sua posição na disputa ou dar lances, habilite-se.' : 'Para ver sua posição na disputa, efetue o login.')}</p>
                                {!userProfileWithPermissions && <Link href={`/auth/login?redirect=/auctions/${auction.publicId || auction.id}/lots/${lot.publicId || lot.id}`} className="text-primary hover:underline font-medium">Faça login ou registre-se.</Link>}
                                {userProfileWithPermissions && (!isUserHabilitado && !hasAdminRights && !isEffectivelySuperTestUser) && <Button size="lg" className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white">HABILITE-SE</Button>}
                            </div>
                            )}
                            <Button variant="outline" className="w-full" onClick={handleToggleFavorite}>
                            <Heart className={`mr-2 h-4 w-4 ${isLotFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                            {isLotFavorite ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <CardTitle className="text-lg flex items-center">Histórico de Lances</CardTitle>
                            {lotBids.length > 2 && (
                                <Button variant="outline" size="sm" onClick={() => setIsAllBidsModalOpen(true)}>Ver Todos ({lotBids.length})</Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            {isLoadingData ? (
                                <div className="flex items-center justify-center h-20"> <Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                            ) : lotBids.length > 0 ? (
                                <ul className="space-y-1.5 text-xs">
                                    {lotBids.slice(0, 2).map(bid => (
                                        <li key={bid.id} className="flex justify-between items-center p-1.5 bg-secondary/40 rounded-md">
                                            <div>
                                                <span className="font-medium text-foreground text-xs">{bid.bidderDisplay}</span>
                                                <span className="text-[0.65rem] text-muted-foreground ml-1.5">({bid.timestamp ? format(new Date(bid.timestamp as string), "dd/MM HH:mm:ss", { locale: ptBR }) : 'Data Indisponível'})</span>
                                            </div>
                                            <span className="font-semibold text-primary text-xs">R$ {bid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">Nenhum lance registrado para este lote ainda.</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="w-full aspect-square">
                        <LotMapDisplay lot={lot} platformSettings={platformSettings} />
                    </div>
                </div>
            </div>

            {platformSettings.showRelatedLotsOnLotDetail !== false && relatedLots.length > 0 && (
                <section className="mt-12">
                    <Separator className="my-8" />
                    <h2 className="text-2xl font-bold mb-6 font-headline">Outros Lotes Deste Leilão</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {relatedLots.map(relatedLot => (
                            <LotCard
                                key={relatedLot.id}
                                lot={relatedLot}
                                platformSettingsProp={platformSettings}
                                badgeVisibilityConfig={platformSettings.sectionBadgeVisibility?.searchGrid}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
      <LotPreviewModal
        lot={lot}
        auction={auction}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
      <LotAllBidsModal
        isOpen={isAllBidsModalOpen}
        onClose={() => setIsAllBidsModalOpen(false)}
        lotBids={lotBids}
        lotTitle={lot.title}
      />
    </>
  );
}
