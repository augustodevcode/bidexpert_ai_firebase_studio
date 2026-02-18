
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
import React from 'react';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Lot, Auction, BidInfo, Review, LotQuestion, SellerProfileInfo, PlatformSettings, AuctionStage, LotCategory, UserLotMaxBid, LotDocument, JudicialActionType, OccupationStatus, LotRisk, LotRiskLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, Key, Info,
    Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, ThumbsUp,
    ShieldCheck, HelpCircle, ShoppingCart, Heart, X, Facebook, Mail, MessageSquareText, Gavel, ImageOff, Loader2, FileText, ThumbsDown, MessageCircle, Send, Eye, ExternalLink, ListFilter, FileQuestion, Banknote, Building, Link2 as LinkIcon, AlertCircle, Percent, Zap, TrendingUp, Crown, Layers, UserCircle, Scale, Bot, Pencil, Download, Phone, Smartphone
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isPast, differenceInSeconds, parseISO, isValid, format, differenceInDays } from 'date-fns';
import { addRecentlyViewedId } from '@/lib/recently-viewed-store';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, slugify, getAuctionStatusColor, isValidImageUrl, getActiveStage, getLotPriceForStage } from '@/lib/ui-helpers';

import { getReviewsForLot, createReview, getQuestionsForLot, askQuestionOnLot, getActiveUserLotMaxBid, placeBidOnLot, generateWinningBidTermAction, getLotDocuments, getBidsForLot } from './actions';
import { checkHabilitationForAuctionAction } from '@/app/admin/habilitations/actions';
import { recordEntityView } from '@/services/view-metrics.service';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotDescriptionTab from '@/components/auction/lot-description-tab';
import LotSpecificationTab from '@/components/auction/lot-specification-tab';
import LotSellerTab from '@/components/auction/lot-seller-tab';
import LotReviewsTab from '@/components/auction/lot-reviews-tab';
import LotQuestionsTab from '@/components/auction/lot-questions-tab';
import type { AuctionContactInfo } from '@/services/auction-contact.service';

import LotPreviewModal from '@/components/lot-preview-modal';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useFloatingActions } from '@/components/floating-actions/floating-actions-provider';
import LotAllBidsModal from '@/components/auction/lot-all-bids-modal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BiddingPanel from '@/components/auction/bidding-panel';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import BidExpertAuctionStagesTimeline from '@/components/auction/BidExpertAuctionStagesTimeline';
import BidExpertCard from '@/components/BidExpertCard';
import { InvestorAnalysisSection } from '@/components/lots';
import { ptBR } from 'date-fns/locale';
import StickyBidBar from '@/components/auction/sticky-bid-bar';


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
  const [isClient, setIsClient] = useState(false);
  const [formattedStartDate, setFormattedStartDate] = useState<string | null>(null);
  const [formattedEndDate, setFormattedEndDate] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

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
  }, [effectiveEndDate, lotStatus, isClient]);

  // Client-side only date formatting to prevent hydration mismatch
  useEffect(() => {
    if (!isClient) return;
    if (effectiveStartDate && isValid(effectiveStartDate)) {
      setFormattedStartDate(format(effectiveStartDate, 'dd/MM/yy HH:mm', { locale: ptBR }));
    }
    if (effectiveEndDate && isValid(effectiveEndDate)) {
      setFormattedEndDate(format(effectiveEndDate, 'dd/MM/yy HH:mm', { locale: ptBR }));
    }
  }, [effectiveStartDate, effectiveEndDate, isClient]);

  if (!isClient) {
    return <div className={cn("absolute bottom-0 left-0 right-0 p-2 text-center text-white bg-gradient-to-t from-black/80 to-transparent", className)}><Skeleton className="h-12 w-3/4 mx-auto" /></div>;
  }

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
  auctionContact: AuctionContactInfo | null;
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

const occupancyLabels: Record<OccupationStatus, string> = {
  OCCUPIED: 'Ocupado',
  UNOCCUPIED: 'Desocupado',
  UNCERTAIN: 'Não verificado',
  SHARED_POSSESSION: 'Posse compartilhada',
};

const occupancyStyles: Record<OccupationStatus, string> = {
  OCCUPIED: 'bg-amber-100 text-amber-900 border-amber-300',
  UNOCCUPIED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  UNCERTAIN: 'bg-slate-100 text-slate-800 border-slate-300',
  SHARED_POSSESSION: 'bg-blue-100 text-blue-800 border-blue-300',
};

const actionTypeLabels: Partial<Record<JudicialActionType, string>> = {
  PENHORA: 'Penhora/Execução',
  USUCAPIAO: 'Usucapião',
  HIPOTECA: 'Hipoteca',
  DESPEJO: 'Despejo',
  REMOCAO: 'Remoção',
  COBRANCA: 'Cobrança',
  INVENTARIO: 'Inventário',
  DIVORCIO: 'Divórcio',
  OUTROS: 'Outros',
};

const riskLevelStyles: Record<LotRiskLevel, string> = {
  CRITICO: 'bg-destructive/10 text-destructive border-destructive/40',
  ALTO: 'bg-amber-100 text-amber-900 border-amber-300',
  MEDIO: 'bg-primary/10 text-primary border-primary/30',
  BAIXO: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const riskTypeLabels: Record<string, string> = {
  OCUPACAO_IRREGULAR: 'Ocupação irregular',
  PENHORA: 'Penhora/Gravame',
  INSCRICAO_DIVIDA: 'Inscrição em dívida',
  RESTRICAO_AMBIENTAL: 'Restrição ambiental',
  DOENCA_ACARAJADO: 'Restrição sanitária',
  OUTRO: 'Outro',
};

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
  auctionContact,
}: LotDetailClientContentProps) {
  const [lot, setLot] = useState<Lot>(initialLot);
  const [isLotFavorite, setIsLotFavorite] = useState(false);
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const { setPageActions } = useFloatingActions();
  const [lotReviews, setLotReviews] = useState<Review[]>([]);
  const [lotQuestions, setLotQuestions] = useState<LotQuestion[]>([]);
  const [lotDocuments, setLotDocuments] = useState<LotDocument[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [formattedAuctionEndDate, setFormattedAuctionEndDate] = useState<string | null>(null);
  const [isHabilitadoForThisAuction, setIsHabilitadoForThisAuction] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [api, setApi] = useState<CarouselApi>()
  const [sharedBidHistory, setSharedBidHistory] = useState<BidInfo[]>([]);
  const [isLoadingBidHistory, setIsLoadingBidHistory] = useState(true);

  useEffect(() => {
    if (!api) {
      return
    }
 
    api.on("select", () => {
      setCurrentImageIndex(api.selectedScrollSnap())
    })
  }, [api])

  useEffect(() => {
    setIsClient(true);
    if (lot?.id) {
      addRecentlyViewedId(lot.id);
      recordEntityView(lot.id);
    }
  }, [lot?.id]);

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

  // Função centralizada para buscar histórico de lances - sincroniza ambos os painéis
  const fetchSharedBidHistory = useCallback(async () => {
    if (!lot?.id) return;
    setIsLoadingBidHistory(true);
    try {
      const history = await getBidsForLot(lot.publicId || lot.id);
      setSharedBidHistory(history);
    } catch (error) {
      console.error('[LotDetailClient] Erro ao buscar histórico de lances:', error);
      toast({ title: "Erro de Conexão", description: "Não foi possível obter o histórico de lances.", variant: "destructive" });
    } finally {
      setIsLoadingBidHistory(false);
    }
  }, [lot?.id, lot?.publicId, toast]);

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

  useEffect(() => {
    if (!hasEditPermissions) {
      setPageActions([]);
      return;
    }

    setPageActions([
      {
        id: 'edit-lot',
        label: 'Editar Lote',
        href: `/admin/lots/${lot.id}/edit`,
        icon: Pencil,
        dataAiId: 'floating-action-edit-lot',
      },
    ]);

    return () => setPageActions([]);
  }, [hasEditPermissions, lot.id, setPageActions]);
  
  const gallery = useMemo(() => {
    if (!lot) return [];
    
    // Check if we should inherit media from a Asset
    if (lot.inheritedMediaFromAssetId && lot.assets && lot.assets.length > 0) {
        const sourceAsset = lot.assets.find((a: any) => a.id.toString() === lot.inheritedMediaFromAssetId.toString());
        if (sourceAsset) {
            const assetImages = [sourceAsset.imageUrl, ...(sourceAsset.galleryImageUrls || [])]
                .filter(Boolean) as string[];
            if (assetImages.length > 0) return assetImages;
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
        setIsLotFavorite(isLotFavoriteInStorage(lot.id.toString()));
    }
    
    // Format the date here to avoid hydration mismatch
    if (isClient && auction.endDate && isValid(new Date(auction.endDate as string))) {
      setFormattedAuctionEndDate(format(new Date(auction.endDate as string), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    }
    
    if (lot?.id) {
      addRecentlyViewedId(lot.id.toString());
      setCurrentImageIndex(0);
      
      // Registrar visualização para métricas (Monitor de Visualizações - audit gap 2.5)
      recordEntityView('Lot', lot.id).catch(console.error);

      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          console.log(`[LotDetailClient] Fetching data for lot ID: ${lot.id}`);
          const [reviews, questions, documents] = await Promise.all([
            getReviewsForLot(lot.publicId || lot.id),
            getQuestionsForLot(lot.publicId || lot.id),
            getLotDocuments(lot.id),
          ]);
          setLotReviews(reviews);
          setLotQuestions(questions);
          setLotDocuments(documents);
        } catch (error: any) {
          console.error("[LotDetailClient] Error fetching data:", error);
          toast({ title: "Erro", description: "Não foi possível carregar todos os dados do lote.", variant: "destructive" });
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
      fetchSharedBidHistory(); // Busca inicial do histórico de lances
    }
  }, [lot?.id, lot.publicId, toast, auction.endDate, isClient, fetchSharedBidHistory]);

  const handleBidSuccess = (updatedLotData: Partial<Lot>, newBid?: BidInfo) => {
    setLot(prevLot => ({...prevLot!, ...updatedLotData}));
    // Atualiza o histórico de lances para sincronizar ambos os painéis
    fetchSharedBidHistory();
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
    if (newFavoriteState) addFavoriteLotIdToStorage(lot.id.toString());
    else removeFavoriteLotIdFromStorage(lot.id.toString());
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
  const actualLotNumber = lot.number || String(lot.id).replace(/\D/g,'').padStart(3, '0');
  const displayLotPosition = lotIndex !== undefined && lotIndex !== -1 ? lotIndex + 1 : 'N/A';
  const displayTotalLots = totalLotsInAuction || auction.totalLots || 'N/A';
  const handleNewReview = async (rating: number, comment: string) => { return false; };
  const handleNewQuestion = async (questionText: string) => { return false; };

  const relatedLots = useMemo(() => {
    if (!auction || !auction.lots || !lot) return [];
    return auction.lots.filter(relatedLot => relatedLot.id !== lot.id).slice(0, platformSettings.relatedLotsCount || 5);
  }, [auction, lot, platformSettings.relatedLotsCount]);

  const highestRisk = useMemo<LotRisk | null>(() => {
    if (!lot?.lotRisks || lot.lotRisks.length === 0) return null;
    const priority: LotRiskLevel[] = ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO'];
    return [...lot.lotRisks].sort((a, b) => priority.indexOf(a.riskLevel as LotRiskLevel) - priority.indexOf(b.riskLevel as LotRiskLevel))[0];
  }, [lot?.lotRisks]);

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
        <div className="wrapper-lot-detail-main" data-ai-id="lot-detail-main">
          <section className="section-lot-detail-header" data-ai-id="lot-detail-header">
            <div className="wrapper-lot-title-actions" data-ai-id="lot-title-section">
              <div className="wrapper-lot-title-info">
                <h1 className="header-lot-title" data-ai-id="lot-detail-title">{lotTitle}</h1>
                <div className="wrapper-lot-status-badge">
                  <Badge className={cn("badge-lot-detail-status", getLotStatusColor(lot.status))} data-ai-id="lot-detail-status">{getAuctionStatusText(lot.status)}</Badge>
                </div>
                <div className="wrapper-lot-legal-badges" data-ai-id="lot-legal-badges">
                  { (lot.propertyMatricula || lot.propertyRegistrationNumber) && (
                    <Badge variant="outline" className="badge-legal-info" data-ai-id="lot-legal-matricula">
                      Matrícula {lot.propertyMatricula || lot.propertyRegistrationNumber}
                    </Badge>
                  )}
                  {lot.actionType && (
                    <Badge variant="outline" className="badge-legal-action" data-ai-id="lot-legal-action">
                      {actionTypeLabels[lot.actionType as JudicialActionType] || lot.actionType}
                    </Badge>
                  )}
                  {lot.occupancyStatus && (
                    <Badge variant="outline" className={cn("badge-legal-occupancy", occupancyStyles[lot.occupancyStatus as OccupationStatus])} data-ai-id="lot-legal-occupancy">
                      Ocupação: {occupancyLabels[lot.occupancyStatus as OccupationStatus]}
                    </Badge>
                  )}
                  {highestRisk && (
                    <Badge variant="outline" className={cn("badge-legal-risk", riskLevelStyles[highestRisk.riskLevel as LotRiskLevel])} data-ai-id="lot-legal-risk">
                      Risco {highestRisk.riskLevel} · {riskTypeLabels[highestRisk.riskType] || highestRisk.riskType}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="wrapper-header-action-buttons" data-ai-id="lot-header-actions">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Compartilhar" className="btn-header-share" data-ai-id="lot-share-btn"><Share2 className="icon-header-action" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="menu-share-content">
                    <DropdownMenuItem asChild><a href={getSocialLink('x', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="item-share-link"><X className="icon-share-platform" /> X (Twitter)</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('facebook', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="item-share-link"><Facebook className="icon-share-platform" /> Facebook</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="item-share-link"><MessageSquareText className="icon-share-platform" /> WhatsApp</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('email', currentUrl, lotTitle)} className="item-share-link"><Mail className="icon-share-platform" /> Email</a></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" asChild aria-label="Voltar para o leilão" className="btn-header-back" data-ai-id="lot-back-btn"><Link href={`/auctions/${auction.publicId || auction.id}`}><ArrowLeft className="icon-header-action" /></Link></Button>
              </div>
            </div>
            <div className="wrapper-lot-navigation" data-ai-id="lot-navigation">
              <span className="text-lot-number-display">Lote Nº: {actualLotNumber}</span>
              <div className="wrapper-nav-buttons" data-ai-id="lot-nav-controls">
                <Button variant="outline" size="icon" className="btn-lot-nav" asChild={!!previousLotId} disabled={!previousLotId} aria-label="Lote Anterior" data-ai-id="lot-nav-prev">{previousLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${previousLotId}`}><ChevronLeft className="icon-nav-action" /></Link> : <ChevronLeft className="icon-nav-action" />}</Button>
                <span className="text-lot-pagination">Lote {displayLotPosition} de {displayTotalLots}</span>
                <Button variant="outline" size="icon" className="btn-lot-nav" asChild={!!nextLotId} disabled={!nextLotId} aria-label="Próximo Lote" data-ai-id="lot-nav-next">{nextLotId ? <Link href={`/auctions/${auction.publicId || auction.id}/lots/${nextLotId}`}><ChevronRight className="icon-nav-action" /></Link> : <ChevronRight className="icon-nav-action" />}</Button>
              </div>
            </div>
            <div className="grid-lot-detail-content" data-ai-id="lot-detail-grid">
              <div className="wrapper-lot-media-and-info" data-ai-id="lot-main-column">
                <Card className="card-lot-gallery" data-ai-id="lot-gallery-card"><CardContent className="content-card-gallery">
                  <div className="wrapper-gallery-main" data-ai-id="lot-gallery-main">
                     {gallery.length > 0 ? (
                        <Carousel className="w-full" setApi={setApi}>
                          <CarouselContent>
                            {gallery.map((url, index) => (
                              <CarouselItem key={index}>
                                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                                   <Image 
                                      src={url} 
                                      alt={`Imagem ${index + 1} de ${lot.title}`} 
                                      fill 
                                      className="object-contain" 
                                      data-ai-hint={lot.dataAiHint || "imagem principal lote"} 
                                      priority={index === 0} 
                                      unoptimized={url.startsWith('https://placehold.co')}
                                   />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          {gallery.length > 1 && (
                            <>
                              <CarouselPrevious className="left-2" />
                              <CarouselNext className="right-2" />
                            </>
                          )}
                        </Carousel>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground aspect-video bg-muted rounded-md">
                           <ImageOff className="h-16 w-16 mb-2" />
                           <span>Imagem principal não disponível</span>
                        </div>
                     )}
                     {platformSettings.showCountdownOnLotDetail !== false && (<DetailTimeRemaining effectiveEndDate={effectiveLotEndDate} effectiveStartDate={effectiveLotStartDate} lotStatus={lot.status} className="rounded-b-md" />)}
                  </div>

                  {gallery.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                      {gallery.map((url, index) => (
                        <button 
                          key={index} 
                          className={`relative aspect-square bg-muted rounded-sm overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`} 
                          onClick={() => api?.scrollTo(index)} 
                          aria-label={`Ver imagem ${index + 1}`}
                        >
                          <Image src={url} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem galeria carro'} unoptimized={url.startsWith('https://placehold.co')}/>
                        </button>
                      ))}
                    </div>
                  )}
                  {gallery.length === 0 && (<p className="text-sm text-center text-muted-foreground py-4">Nenhuma imagem na galeria.</p>)}
                  
                  <div className="wrapper-gallery-footer-info" data-ai-id="lot-gallery-info">
                    {lot.hasKey && <span className="item-gallery-info" data-ai-id="lot-has-key"><Key className="icon-gallery-info"/> Chave Presente</span>}
                    <span className="item-gallery-info" data-ai-id="lot-location"><MapPin className="icon-gallery-info"/> Localização: {lotLocation}</span>
                  </div>
                </CardContent></Card>
                
                {/* Mobile Bidding Panel */}
                <div className="block lg:hidden">
                  <BiddingPanel 
                    currentLot={lot} 
                    auction={auction} 
                    onBidSuccess={handleBidSuccess}
                    isHabilitadoForThisAuction={isHabilitadoForThisAuction}
                    onHabilitacaoSuccess={handleHabilitacaoSuccess}
                    activeStage={activeStage}
                    activeLotPrices={activeLotPrices}
                    sharedBidHistory={sharedBidHistory}
                    isLoadingSharedHistory={isLoadingBidHistory}
                    onRefreshBidHistory={fetchSharedBidHistory}
                  />
                </div>

                <Card id="auction-details-section" className="card-auction-details-summary" data-ai-id="lot-auction-summary-card">
                  <CardHeader className="header-card-auction-summary">
                    <CardTitle className="header-card-auction-summary-title">
                      <Gavel className="icon-card-header-summary" />
                      Informações do Leilão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="content-card-auction-summary" data-ai-id="lot-auction-summary-content">
                    <div className="wrapper-auction-summary-main">
                      {auctioneer?.logoUrl && (
                        <Avatar className="avatar-auctioneer-summary" data-ai-id="lot-auctioneer-avatar">
                          <AvatarImage src={auctioneer.logoUrl} alt={auctioneerName || ''} data-ai-hint={auctioneer.dataAiHintLogo || 'logo leiloeiro'} />
                          <AvatarFallback>{auctioneerInitial}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="wrapper-auction-summary-info">
                        <Link href={`/auctions/${auction.publicId || auction.id}`} className="link-auction-summary-title" data-ai-id="lot-auction-summary-link">
                          <p className="text-auction-summary-title">{auction.title}</p>
                        </Link>
                        <div className="grid-auction-summary-details" data-ai-id="lot-auction-summary-grid">
                          <div className="item-auction-summary-detail">
                            <UserCircle className="icon-summary-detail" />
                            <span>Leiloeiro: <span className="text-summary-detail-value">{auctioneerName}</span></span>
                          </div>
                          <div className="item-auction-summary-detail">
                            <Tag className="icon-summary-detail" />
                            <span>Categoria: <span className="text-summary-detail-value">{auction.category?.name || 'Não informada'}</span></span>
                          </div>
                          <div className="item-auction-summary-detail">
                            <Gavel className="icon-summary-detail" />
                            <span>Modalidade: <span className="text-summary-detail-value">{auction.auctionType || 'Não especificada'}</span></span>
                          </div>
                          <div className="item-auction-summary-detail">
                            <Info className="icon-summary-detail" />
                            <span>Status:<Badge variant="outline" className={cn("badge-summary-status", getAuctionStatusColor(auction.status))}>{getAuctionStatusText(auction.status)}</Badge></span>
                          </div>
                          {auction.endDate && (
                            <div className="item-auction-summary-detail">
                              <CalendarDays className="icon-summary-detail" />
                              <span>Fim: <span className="text-summary-detail-value">{formattedAuctionEndDate ? formattedAuctionEndDate : '...'}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Section */}
                    {auction?.auctionStages && auction.auctionStages.length > 0 && (
                      <div className="wrapper-auction-summary-timeline" data-ai-id="lot-auction-summary-timeline">
                        <h3 className="header-summary-timeline-title">
                          <CalendarDays className="icon-summary-timeline" />
                          Cronograma de Praças
                        </h3>
                        <div className="wrapper-summary-timeline-content">
                           <BidExpertAuctionStagesTimeline auction={auction} lot={lot} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="footer-card-auction-summary">
                    <Button asChild variant="outline" size="sm" className="btn-summary-view-all" data-ai-id="lot-auction-view-all-lots">
                      <Link href={`/auctions/${auction.publicId || auction.id}`}>
                        Ver todos os lotes do leilão <ChevronRight className="icon-summary-btn-action" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                <Card className="shadow-lg">
                  <CardHeader><CardTitle className="text-xl font-semibold flex items-center"><FileText className="h-5 w-5 mr-2 text-muted-foreground" />Detalhes do Lote</CardTitle></CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
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
                          <CardHeader className="px-1 pt-0"><CardTitle className="text-xl font-semibold flex items-center"><FileText className="h-5 w-5 mr-2 text-muted-foreground" /> {legalTabTitle}</CardTitle></CardHeader>
                          <CardContent className="px-1 space-y-3 text-sm">
                            {showLegalProcessTab && (
                              <>
                                <div className="space-y-2">
                                  {lot.judicialProcessNumber && <p><strong className="text-foreground">Nº Processo Judicial:</strong> <span className="text-muted-foreground">{lot.judicialProcessNumber}</span></p>}
                                  {lot.courtDistrict && <p><strong className="text-foreground">Comarca:</strong> <span className="text-muted-foreground">{lot.courtDistrict}</span></p>}
                                  {lot.courtName && <p><strong className="text-foreground">Vara:</strong> <span className="text-muted-foreground">{lot.courtName}</span></p>}
                                  {lot.publicProcessUrl && <p><strong className="text-foreground">Consulta Pública:</strong> <a href={lot.publicProcessUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Acessar Processo <LinkIcon className="h-3 w-3"/></a></p>}
                                  {(lot.propertyMatricula || lot.propertyRegistrationNumber) && <p><strong className="text-foreground">Matrícula / Registro:</strong> <span className="text-muted-foreground">{lot.propertyMatricula || lot.propertyRegistrationNumber}</span></p>}
                                  {lot.actionType && <p><strong className="text-foreground">Tipo de Ação:</strong> <span className="text-muted-foreground">{actionTypeLabels[lot.actionType as JudicialActionType] || lot.actionType}</span></p>}
                                  {lot.actionCnjCode && <p><strong className="text-foreground">CNJ/Órgão:</strong> <span className="text-muted-foreground">{lot.actionCnjCode}</span></p>}
                                  {lot.actionDescription && <p><strong className="text-foreground">Resumo da Ação:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.actionDescription}</span></p>}
                                  {lot.propertyLiens && <p><strong className="text-foreground">Ônus/Gravames:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.propertyLiens}</span></p>}
                                  {lot.knownDebts && <p><strong className="text-foreground">Dívidas Conhecidas:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.knownDebts}</span></p>}
                                  {lot.additionalDocumentsInfo && <p><strong className="text-foreground">Outras Informações/Links de Documentos:</strong> <span className="text-muted-foreground whitespace-pre-line">{lot.additionalDocumentsInfo}</span></p>}
                                </div>
                                <Separator className="my-3" />
                              </>
                            )}

                            {lot.lotRisks && lot.lotRisks.length > 0 && (
                              <div className="space-y-2" data-ai-id="lot-risk-list">
                                <h4 className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Riscos identificados</h4>
                                <div className="space-y-2">
                                  {lot.lotRisks.map((risk) => (
                                    <div key={risk.id} className={`border rounded-md p-3 flex flex-col gap-1 ${riskLevelStyles[risk.riskLevel as LotRiskLevel]}`}>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold">{riskTypeLabels[risk.riskType] || risk.riskType}</span>
                                        <span className="uppercase tracking-wide text-[11px]">{risk.riskLevel}</span>
                                      </div>
                                      <p className="text-sm text-foreground">{risk.riskDescription}</p>
                                      {risk.mitigationStrategy && <p className="text-xs text-muted-foreground">Mitigação: {risk.mitigationStrategy}</p>}
                                      {risk.verified && <span className="text-[11px] text-emerald-700">Verificado</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {auction.documentsUrl && (
                              <p><strong className="text-foreground">Edital do Leilão:</strong> <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Ver Edital Completo <FileText className="h-3 w-3"/></a></p>
                            )}
                            {!auction.documentsUrl && !showLegalProcessTab && (
                              <p className="text-muted-foreground">Nenhuma informação legal ou documental adicional fornecida para este lote.</p>
                            )}
                            {auction.documentsUrl && !showLegalProcessTab && !currentLotHasProcessInfo && (
                              <p className="text-muted-foreground mt-2 text-xs">Outras informações processuais específicas deste lote não foram fornecidas.</p>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="seller"><LotSellerTab sellerName={initialSellerName || auction.seller?.name || "Não Informado"} sellerId={lot.sellerId} auctionSellerName={auction.seller?.name} /></TabsContent>
                      <TabsContent value="reviews"><LotReviewsTab lot={lot} reviews={lotReviews} isLoading={isLoadingData} onNewReview={handleNewReview} canUserReview={canUserReview} /></TabsContent>
                      <TabsContent value="questions"><LotQuestionsTab lot={lot} questions={lotQuestions} isLoading={isLoadingData} onNewQuestion={handleNewQuestion} canUserAskQuestion={canUserAskQuestion} /></TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
                
                {/* Investor Analysis Section - Gaps Implementation */}
                <InvestorAnalysisSection 
                  lot={lot}
                  auction={auction}
                  platformSettings={platformSettings}
                  bidHistory={sharedBidHistory}
                />
                
                {/* Documents Section */}
                <Card className="shadow-lg" id="documents-section">
                    <CardHeader><CardTitle className="text-xl font-semibold flex items-center"><FileText className="h-5 w-5 mr-2 text-muted-foreground" />Documentos do Lote</CardTitle></CardHeader>
                    <CardContent>
                    {lotDocuments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {lotDocuments.map((doc) => (
                            <Button key={doc.id} variant="outline" className="h-auto py-3 justify-start" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2 text-primary" />
                                <div className="flex flex-col items-start">
                                <span className="font-medium">{doc.title}</span>
                                {doc.description && <span className="text-xs text-muted-foreground">{doc.description}</span>}
                                </div>
                            </a>
                            </Button>
                        ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Nenhum documento disponível para este lote.</p>
                    )}
                    </CardContent>
                </Card>

                {/* Map Section */}
                <Card className="shadow-lg" id="map-section">
                    <CardHeader><CardTitle className="text-xl font-semibold flex items-center"><MapPin className="h-5 w-5 mr-2 text-muted-foreground" />Localização do Lote</CardTitle></CardHeader>
                    <CardContent className="p-0 overflow-hidden rounded-b-lg">
                        <LotMapDisplay lot={lot} platformSettings={platformSettings} onOpenMapModal={() => setIsMapModalOpen(true)} />
                    </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 self-start hidden lg:block">
                  <BiddingPanel 
                    currentLot={lot} 
                    auction={auction} 
                    onBidSuccess={handleBidSuccess}
                    isHabilitadoForThisAuction={isHabilitadoForThisAuction}
                    onHabilitacaoSuccess={handleHabilitacaoSuccess}
                    activeStage={activeStage}
                    activeLotPrices={activeLotPrices}
                    sharedBidHistory={sharedBidHistory}
                    isLoadingSharedHistory={isLoadingBidHistory}
                    onRefreshBidHistory={fetchSharedBidHistory}
                  />
                  <Card className="shadow-md"><CardHeader><CardTitle className="text-lg font-semibold flex items-center"><Scale className="h-5 w-5 mr-2 text-muted-foreground"/>Valores e Condições Legais</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{activeLotPrices?.initialBid && <div className="flex justify-between"><span className="text-muted-foreground">Lance Inicial ({activeStage?.name || 'Etapa'}):</span> <span className="font-semibold text-foreground">R$ {activeLotPrices.initialBid.toLocaleString('pt-BR')}</span></div>}{lot.secondInitialPrice && <div className="flex justify-between"><span className="text-muted-foreground">2ª Praça (Lance Inicial):</span> <span className="font-semibold text-foreground">R$ {Number(lot.secondInitialPrice).toLocaleString('pt-BR')}</span></div>}{lot.debtAmount && <div className="flex justify-between"><span className="text-muted-foreground">Montante da Dívida:</span> <span className="font-semibold text-foreground">R$ {lot.debtAmount.toLocaleString('pt-BR')}</span></div>}{lot.itbiValue && <div className="flex justify-between"><span className="text-muted-foreground">Valor de ITBI:</span> <span className="font-semibold text-foreground">R$ {lot.itbiValue.toLocaleString('pt-BR')}</span></div>}{!activeLotPrices?.initialBid && !lot.secondInitialPrice && !lot.debtAmount && !lot.itbiValue && <p className="text-muted-foreground text-center text-xs py-2">Nenhuma condição de valor especial para este lote.</p>}</CardContent></Card>
                  
                  {/* Contact Info - Hierarquical: Auction -> Auctioneer -> Platform */}
                  <Card className="shadow-md" data-ai-id="auction-contact-info-card">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Phone className="h-5 w-5 mr-2 text-muted-foreground"/>
                        Contato e Suporte
                      </CardTitle>
                      {auctionContact && auctionContact.source !== 'platform' && (
                        <CardDescription className="text-xs">
                          {auctionContact.source === 'auction' && '📋 Contato específico deste leilão'}
                          {auctionContact.source === 'auctioneer' && `👤 Contato do leiloeiro${auctioneer?.name ? ` - ${auctioneer.name}` : ''}`}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {auctionContact?.phone && (
                        <div className="flex items-center" data-ai-id="contact-phone">
                          <Phone className="h-4 w-4 mr-2 text-primary"/>
                          <span>{auctionContact.phone}</span>
                        </div>
                      )}
                      {auctionContact?.whatsapp && (
                        <div className="flex items-center" data-ai-id="contact-whatsapp">
                          <Smartphone className="h-4 w-4 mr-2 text-green-500"/>
                          <a 
                            href={`https://wa.me/${auctionContact.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {auctionContact.whatsapp}
                          </a>
                        </div>
                      )}
                      {auctionContact?.email && (
                        <div className="flex items-center" data-ai-id="contact-email">
                          <Mail className="h-4 w-4 mr-2 text-primary"/>
                          <a href={`mailto:${auctionContact.email}`} className="hover:underline">
                            {auctionContact.email}
                          </a>
                        </div>
                      )}
                      {!auctionContact?.phone && !auctionContact?.whatsapp && !auctionContact?.email && (
                        <p className="text-muted-foreground" data-ai-id="contact-unavailable">
                          Contatos não disponíveis.
                        </p>
                      )}
                    </CardContent>
                  </Card>
              </div>
            </div>
          </section>
          
          {platformSettings.showRelatedLotsOnLotDetail !== false && relatedLots.length > 0 && (
            <section className="pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6 font-headline text-center">Outros Lotes Deste Leilão</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedLots.map((relatedLot) => (
                    <BidExpertCard
                      key={relatedLot.id}
                      item={relatedLot}
                      type="lot"
                      platformSettings={platformSettings}
                      parentAuction={auction}
                    />
                ))}
              </div>
            </section>
          )}
        </div>
      </TooltipProvider>

      <LotPreviewModal lot={lot} auction={auction} platformSettings={platformSettings} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
      <LotMapPreviewModal lot={lot} platformSettings={platformSettings!} isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} />

      {/* GAP 3.2: Sticky Mobile Bid Bar */}
      <StickyBidBar lot={lot} auction={auction} />
    </>
    );
}
