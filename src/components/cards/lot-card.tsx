// src/components/cards/lot-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction, Lot, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings } from '@/types';
import { Heart, Share2, Eye, MapPin, Gavel, Percent, Zap, TrendingUp, Crown, Tag, Pencil, Clock, X, Facebook, MessageSquareText, Mail, Users, ShieldCheck } from 'lucide-react';
import { isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModalV2 from '@/components/lot-preview-modal-v2';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, isValidImageUrl, getActiveStage, getLotPriceForStage, getAuctionTypeDisplayData, getLotDisplayPrice } from '@/lib/ui-helpers';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from '../entity-edit-menu';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { Skeleton } from '../ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import LotCountdown from '../lot-countdown';
import BidExpertAuctionStagesTimeline from '@/components/auction/BidExpertAuctionStagesTimeline';
import ConsignorLogoBadge from '../consignor-logo-badge';


interface LotCardProps {
  lot: Lot;
  auction?: Auction; // The parent auction, if available
  platformSettings: PlatformSettings;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  onUpdate?: () => void;
  showCountdown?: boolean;
}

function LotCardClientContent({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate, showCountdown = false }: LotCardProps) {
  console.log('LotCard debug:', { lotId: lot.id, auctionStages: auction?.auctionStages, lotPrices: lot.lotPrices });
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [isViewed, setIsViewed] = React.useState(false);
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();
  const [lotFullUrl, setLotFullUrl] = React.useState('');

  const hasEditPermission = hasPermission(userProfileWithPermissions, 'manage_all');

  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings.sectionBadgeVisibility?.searchGrid || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  };

  const showCountdownOnThisCard = showCountdown && platformSettings.showCountdownOnCards !== false;

  const { effectiveLotEndDate } = React.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = React.useMemo(() => getActiveStage(auction?.auctionStages), [auction]);
  const activeLotPrices = React.useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);

  const auctionTypeDisplay = getAuctionTypeDisplayData(auction?.auctionType);
  const AuctionTypeIcon = auctionTypeDisplay?.icon;
  const timelineReferenceDate = React.useMemo(() => {
    if (!auction) {
      return null;
    }
    if (auction.auctionDate) {
      try {
        return new Date(auction.auctionDate as string);
      } catch {
        return null;
      }
    }

    const firstStageWithDate = auction.auctionStages?.find(stage => stage.startDate);
    if (firstStageWithDate?.startDate) {
      try {
        return new Date(firstStageWithDate.startDate as string);
      } catch {
        return null;
      }
    }

    return null;
  }, [auction]);

  React.useEffect(() => {
    setIsFavorite(isLotFavoriteInStorage(lot.id.toString()));
    setIsViewed(getRecentlyViewedIds().includes(lot.id.toString()));
    if (typeof window !== 'undefined') {
      setLotFullUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    }
  }, [lot.id, lot.auctionId, lot.publicId]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id.toString());
    } else {
      removeFavoriteLotIdFromStorage(lot.id.toString());
    }
    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lot.title}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };

  const handlePreviewOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch (platform) {
      case 'x': return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email': return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';
  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
  const sellerName = auction?.seller?.name;
  const sellerSlug = auction?.seller?.slug || auction?.seller?.publicId || auction?.seller?.id;
  const sellerLogoUrl = isValidImageUrl(auction?.seller?.logoUrl) ? auction?.seller?.logoUrl : undefined;
  const consignorInitial = sellerName ? sellerName.charAt(0).toUpperCase() : 'C';

  const discountPercentage = React.useMemo(() => {
    if (activeLotPrices?.initialBid && lot.evaluationValue && activeLotPrices.initialBid < lot.evaluationValue) {
      return Math.round(((lot.evaluationValue - activeLotPrices.initialBid) / lot.evaluationValue) * 100);
    }
    return lot.discountPercentage || 0;
  }, [activeLotPrices, lot.evaluationValue, lot.discountPercentage]);

  const mentalTriggers = React.useMemo(() => {
    let triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    const settings = mentalTriggersGlobalSettings;

    if (sectionBadges.showPopularityBadge !== false && settings.showPopularityBadge && (lot.views || 0) > (settings.popularityViewThreshold || 500)) {
      triggers.push('MAIS VISITADO');
    }
    if (sectionBadges.showHotBidBadge !== false && settings.showHotBidBadge && (lot.bidsCount || 0) > (settings.hotBidThreshold || 10) && lot.status === 'ABERTO_PARA_LANCES') {
      triggers.push('LANCE QUENTE');
    }
    if (sectionBadges.showExclusiveBadge !== false && settings.showExclusiveBadge && lot.isExclusive) {
      triggers.push('EXCLUSIVO');
    }
    return Array.from(new Set(triggers));
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings, sectionBadges]);
  const imageUrlToDisplay = lot.imageUrl;
  const lotNumber = lot.number || String(lot.id).replace(/\D/g, '').padStart(3, '0');

  return (
    <>
      <Card data-ai-id={`lot-card-${lot.id}`} data-testid="lot-card" className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group relative">
        <div className="relative">
          <Link href={lotDetailUrl} className="block">
            <div className="aspect-video relative bg-muted">
              <Image
                src={isValidImageUrl(imageUrlToDisplay) ? imageUrlToDisplay! : `https://picsum.photos/seed/${lot.id}/600/400`}
                alt={lot.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={lot.dataAiHint || 'imagem lote'}
                data-ai-id="lot-card-main-image"
              />
            </div>
          </Link>
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10" data-ai-id="lot-card-status-badges">
            <Badge className={`text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
              {getAuctionStatusText(lot.status)}
            </Badge>
          </div>
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10" data-ai-id="lot-card-mental-triggers">
            {sectionBadges.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentage > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse"><Percent className="h-3 w-3 mr-1" /> {discountPercentage}% OFF</Badge>
            )}
            {/* GAP 1.6: Badge Oportunidade when discount >= 40% */}
            {discountPercentage >= 40 && (
              <Badge variant="default" className="text-xs bg-green-600 text-white border-green-700">
                <Zap className="h-3 w-3 mr-0.5" /> Oportunidade
              </Badge>
            )}
            {mentalTriggers.map(trigger => (
              <Badge key={trigger} variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                {trigger === 'LANCE QUENTE' && <Zap className="h-3 w-3 mr-0.5 text-red-500 fill-red-500" />}
                {trigger === 'EXCLUSIVO' && <Crown className="h-3 w-3 mr-0.5 text-purple-600" />}
                {trigger}
              </Badge>
            ))}
          </div>
          <ConsignorLogoBadge
            href={sellerSlug ? `/sellers/${sellerSlug}` : undefined}
            logoUrl={sellerLogoUrl}
            fallbackInitial={consignorInitial}
            name={sellerName}
            dataAiHint={auction?.seller?.dataAiHintLogo || 'logo comitente pequeno'}
            anchorClassName="absolute bottom-2 left-2"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center gap-2 pointer-events-none">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background pointer-events-auto" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button></TooltipTrigger>
                <TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background pointer-events-auto" onClick={handlePreviewOpen} aria-label="Pré-visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger>
                <TooltipContent><p>Pré-visualizar</p></TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background pointer-events-auto"><Share2 className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild><a href={getSocialLink('x', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><X className="h-3.5 w-3.5" /> X (Twitter)</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href={getSocialLink('facebook', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><Facebook className="h-3.5 w-3.5" /> Facebook</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><MessageSquareText className="h-3.5 w-3.5" /> WhatsApp</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href={getSocialLink('email', lotFullUrl, lot.title)} className="flex items-center gap-2 cursor-pointer"><Mail className="h-3.5 w-3.5" /> Email</a></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {hasEditPermission && <div className="pointer-events-auto"><EntityEditMenu entityType="lot" entityId={lot.id.toString()} publicId={lot.publicId} currentTitle={lot.title} isFeatured={lot.isFeatured || false} onUpdate={onUpdate} /></div>}
            </TooltipProvider>
          </div>
        </div>
        <CardContent className="p-3 flex-grow space-y-2">
          <Link href={lotDetailUrl}>
            <div className="flex items-center gap-1.5 mb-0.5" data-ai-id="lot-card-auction-info">
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded font-mono">
                {auction?.publicId || `AUC-${lot.auctionId}`}
              </span>
            </div>
            <h3 data-ai-id="lot-card-title" className="text-base font-bold text-zinc-900 dark:text-white hover:text-primary transition-colors leading-tight line-clamp-2">
              Lote {lotNumber}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 font-normal">
              {lot.title}
            </p>
          </Link>

          <div className="flex items-center text-xs text-muted-foreground" data-ai-id="lot-card-location">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{displayLocation}</span>
          </div>

          {/* Property Details (Area, Status) */}
          {(lot.type === 'IMOVEL' || lot.type === 'imovel') && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground my-1">
              {lot.totalArea && (
                <div className="flex items-center gap-1" title="Área Total">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M5 21V7l8-4 8 4v14M5 10a2 2 0 0 0 2-2M19 10a2 2 0 0 1-2-2" />
                  </svg>
                  <span>{Number(lot.totalArea).toLocaleString('pt-BR')}m²</span>
                </div>
              )}
              {lot.occupancyStatus && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${lot.occupancyStatus === 'OCUPADO' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {lot.occupancyStatus === 'OCUPADO' ? 'Ocupado' : 'Desocupado'}
                </div>
              )}
            </div>
          )}


          {/* Price Display - GAP-FIX: Monospaced font + next bid calculator + ancoragem valor avaliação */}
          <div className="flex flex-col mt-2 mb-1" data-ai-id="lot-card-price">
            {/* GAP 2.14 Ancoragem: Valor de avaliação riscado para mostrar desconto */}
            {lot.evaluationValue && discountPercentage > 0 && (
              <p className="text-xs text-muted-foreground line-through font-mono" data-ai-id="lot-card-evaluation-value">
                Avaliação: R$ {Number(lot.evaluationValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              {getLotDisplayPrice(lot, auction).label}
            </p>
            <p className="text-xl font-bold text-primary font-mono tabular-nums">
              R$ {getLotDisplayPrice(lot, auction).value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {/* GAP 2.4: Badge de dívidas conhecidas */}
            {lot.debtAmount && Number(lot.debtAmount) > 0 && (
              <p className="text-[10px] text-destructive font-semibold mt-0.5" data-ai-id="lot-card-debt-badge">
                ⚠️ Débitos: R$ {Number(lot.debtAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
            {/* GAP-FIX: Next Bid Calculator - mostra próximo lance mínimo */}
            {lot.status === 'ABERTO_PARA_LANCES' && lot.bidIncrementStep && (
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5" data-ai-id="lot-card-next-bid">
                Próximo lance: R$ {((getLotDisplayPrice(lot, auction).value || 0) + Number(lot.bidIncrementStep || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="mt-2 border-t pt-2" data-ai-id="lot-card-timeline">
            <BidExpertAuctionStagesTimeline
              stages={auction?.auctionStages || []}
              lot={lot}
              auction={auction}
              auctionOverallStartDate={timelineReferenceDate || undefined}
              variant="compact"
            />
          </div>

          {/* Footer Info */}
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-1 pt-1">
            <div className="flex items-center gap-1" data-ai-id="lot-card-category">
              <Tag className="h-3 w-3" />
              <span>{lot.type}</span>
            </div>
            <div className="flex items-center gap-1" data-ai-id="lot-card-bid-count">
              <Gavel className="h-3 w-3" />
              <span>{lot.bidsCount || 0} Lances</span>
            </div>
          </div>

          {/* GAP 2.1 Social Proof: Simulated viewers + GAP 2.8 Reserve Status */}
          <div className="flex flex-wrap items-center gap-2 mt-1" data-ai-id="lot-card-social-proof">
            {(lot.views || 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground" data-ai-id="lot-card-viewers">
                <Users className="h-3 w-3" />
                {Math.max(1, Math.floor((lot.views || 0) / 10))} olhando agora
              </span>
            )}
            {lot.secondInitialPrice ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-300 text-amber-700 bg-amber-50" data-ai-id="lot-card-reserve-badge">
                2ª Praça
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-green-300 text-green-700 bg-green-50" data-ai-id="lot-card-no-reserve-badge">
                1ª Praça
              </Badge>
            )}
          </div>

          {showCountdownOnThisCard && effectiveLotEndDate && (
            <LotCountdown endDate={effectiveLotEndDate} status={lot.status as any} variant="card" />
          )}
        </CardContent>

        <CardFooter className="p-3 border-t">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link href={lotDetailUrl}>
              <Gavel className="mr-2 h-4 w-4" /> Fazer Lance
            </Link>
          </Button>
        </CardFooter>
      </Card>
      {isPreviewModalOpen && (
        <LotPreviewModalV2
          lot={lot}
          auction={auction}
          platformSettings={platformSettings}
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </>
  );
}

export default function LotCard(props: LotCardProps & { onUpdate?: () => void }) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card data-ai-id={`lot-card-skeleton-${props.lot.id}`} className="flex flex-col overflow-hidden h-full shadow-md rounded-lg">
        <div className="aspect-video relative bg-muted animate-pulse"></div>
        <CardContent className="p-3 flex-grow space-y-1.5">
          <Skeleton className="h-5 bg-muted rounded w-3/4" />
          <Skeleton className="h-4 bg-muted rounded w-1/2" />
          <Skeleton className="h-4 bg-muted rounded w-full" />
        </CardContent>
        <CardFooter className="p-3 border-t">
          <Skeleton className="h-10 bg-muted rounded w-full" />
        </CardFooter>
      </Card>
    );
  }

  return <LotCardClientContent {...props} />;
}
