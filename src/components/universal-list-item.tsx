// src/components/universal-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Tag, MapPin, Gavel, Users, Clock, ListChecks, Heart, Share2, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import { getAuctionStatusText, isValidImageUrl, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AuctionStagesTimeline from './auction/auction-stages-timeline';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import EntityEditMenu from './entity-edit-menu';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal';
import AuctionPreviewModal from './auction-preview-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type Item = Partial<Auction & Lot>;

interface UniversalListItemProps {
  item: Item;
  type: 'auction' | 'lot';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

export default function UniversalListItem({ item, type, platformSettings, parentAuction, onUpdate }: UniversalListItemProps) {
  if (!item) return null;

  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [itemFullUrl, setItemFullUrl] = React.useState<string>('');
  const { toast } = useToast();
  const isAuction = type === 'auction';

  const detailUrl = React.useMemo(() => isAuction
    ? `/auctions/${item.publicId || item.id}`
    : `/auctions/${item.auctionId}/lots/${item.publicId || item.id}`, [isAuction, item]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setItemFullUrl(`${window.location.origin}${detailUrl}`);
    }
    if (!isAuction && item.id) {
        setIsFavorite(isLotFavoriteInStorage(item.id));
    }
  }, [detailUrl, item.id, isAuction]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isAuction || !item.id) return;
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (newFavoriteState) addFavoriteLotIdToStorage(item.id);
    else removeFavoriteLotIdFromStorage(item.id);
    toast({ title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos" });
  };
  
  const openPreviewModal = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsPreviewModalOpen(true);
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
  }


  const mentalTriggers = React.useMemo(() => {
    const triggers: string[] = [];
    if (item.endDate) {
      const endDate = new Date(item.endDate as string);
      if (!isPast(endDate)) {
        const daysDiff = differenceInDays(endDate, new Date());
        if (daysDiff === 0) triggers.push('ENCERRA HOJE');
        else if (daysDiff === 1) triggers.push('ENCERRA AMANHÃ');
      }
    }
    if ((item.totalHabilitatedUsers || 0) > 100) triggers.push('ALTA DEMANDA');
    if (item.isFeaturedOnMarketplace || item.isFeatured) triggers.push('DESTAQUE');
    if (item.additionalTriggers) triggers.push(...item.additionalTriggers);
    return Array.from(new Set(triggers));
  }, [item]);

  const mainImageUrl = isValidImageUrl(item.imageUrl) ? item.imageUrl! : `https://placehold.co/600x400.png?text=Item`;
  const sellerInfo = isAuction ? (item as Auction).seller : parentAuction?.seller;
  const sellerLogoUrl = isValidImageUrl(sellerInfo?.logoUrl) ? sellerInfo?.logoUrl : undefined;
  const auctioneerInfo = isAuction ? (item as Auction).auctioneer : parentAuction?.auctioneer;
  const auctionTypeDisplay = getAuctionTypeDisplayData(item.auctionType as Auction['auctionType']);

  return (
    <>
      <TooltipProvider>
        <Card data-ai-id={`${type}-list-item-card-${item.id}`} className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-auto bg-muted group/image">
              <Link href={detailUrl} className="block h-full w-full">
                <Image
                  src={mainImageUrl}
                  alt={item.title!}
                  fill
                  className="object-cover"
                  data-ai-hint={item.dataAiHint || `${type} image list`}
                />
              </Link>
               {sellerLogoUrl && (
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <div className="absolute bottom-1 right-1 z-10">
                              <Avatar className="h-10 w-10 border-2 bg-background border-border shadow-md">
                                  <AvatarImage src={sellerLogoUrl} alt={sellerInfo?.name || "Logo"} data-ai-hint={sellerInfo?.dataAiHintLogo || 'logo comitente pequeno'} />
                                  <AvatarFallback>{sellerInfo?.name ? sellerInfo.name.charAt(0) : 'S'}</AvatarFallback>
                              </Avatar>
                          </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Comitente: {sellerInfo?.name}</p></TooltipContent>
                  </Tooltip>
              )}
               <div className="absolute top-2 left-2 flex flex-wrap items-start gap-1 z-10" data-ai-id="list-item-status-badges">
                  <Badge className="text-xs px-1.5 py-0.5 shadow-sm">{getAuctionStatusText(item.status)}</Badge>
                  {mentalTriggers.map(trigger => <Badge key={trigger} variant="secondary" className="text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300">{trigger}</Badge>)}
              </div>
              <div className="absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 transform-gpu flex-row items-center justify-center space-x-1.5 opacity-0 transition-all duration-300 group-hover/image:-translate-y-0 group-hover/image:opacity-100 translate-y-4">
                  <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"} disabled={isAuction}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={openPreviewModal} aria-label="Pré-visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
                  <DropdownMenu>
                      <Tooltip>
                          <TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" aria-label="Compartilhar"><Share2 className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger></TooltipTrigger>
                          <TooltipContent><p>Compartilhar</p></TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem asChild><a href={getSocialLink('x', itemFullUrl, item.title!)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><X className="h-3.5 w-3.5" /> X (Twitter)</a></DropdownMenuItem>
                          <DropdownMenuItem asChild><a href={getSocialLink('facebook', itemFullUrl, item.title!)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><Facebook className="h-3.5 w-3.5" /> Facebook</a></DropdownMenuItem>
                          <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', itemFullUrl, item.title!)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><MessageSquareText className="h-3.5 w-3.5" /> WhatsApp</a></DropdownMenuItem>
                          <DropdownMenuItem asChild><a href={getSocialLink('email', itemFullUrl, item.title!)} className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5" /> Email</a></DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-col flex-grow p-4">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex-grow min-w-0">
                  <Link href={detailUrl}>
                    <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={item.title!}>
                      {isAuction ? item.title : `Lote ${item.number || ''} - ${item.title}`}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`ID: ${item.publicId || item.id}`}>ID: {item.publicId || item.id}</p>
                </div>
                <EntityEditMenu entityType={type} entityId={item.id!} publicId={item.publicId!} currentTitle={item.title!} isFeatured={item.isFeatured || item.isFeaturedOnMarketplace || false} onUpdate={onUpdate}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                  {isAuction ? (
                      <>
                          <div className="flex items-center">{auctionTypeDisplay?.icon && React.cloneElement(auctionTypeDisplay.icon, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" })}<span>{auctionTypeDisplay?.label}</span></div>
                          <div className="flex items-center"><ListChecks className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{item.totalLots || 0} Lotes</span></div>
                          <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 mr-0.5 text-primary/80" /><span className="truncate">{item.city} - {item.state}</span>{item.latitude && item.longitude && (<a href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}><MapPin className="h-3 w-3" /></a>)}</div>
                          <div className="flex items-center"><Users className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{item.totalHabilitatedUsers || 0} Habilitados</span></div>
                      </>
                  ) : (
                      <>
                          <div className="flex items-center"><Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span>{item.type || 'N/A'}</span></div>
                          <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 mr-0.5 text-primary/80" /><span className="truncate">{item.cityName} - {item.stateUf}</span>{item.latitude && item.longitude && (<a href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}><MapPin className="h-3 w-3" /></a>)}</div>
                          <div className="flex items-center"><Gavel className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{item.bidsCount || 0} Lances</span></div>
                          <div className="flex items-center"><Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{item.views || 0} Visitas</span></div>
                      </>
                  )}
                   {auctioneerInfo?.name && (
                      <div className="flex items-center col-span-1 sm:col-span-2"><Users className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span>Leiloeiro: {auctioneerInfo.name}</span></div>
                   )}
              </div>
              {isAuction && (item as Auction).auctionStages && ((item as Auction).auctionStages!.length > 0) && (
                  <div className="my-2 p-3 bg-muted/30 rounded-md">
                      <AuctionStagesTimeline auctionOverallStartDate={new Date(item.auctionDate as string)} stages={(item as Auction).auctionStages!} />
                  </div>
              )}
              <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
                <div className="flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{isAuction ? 'A partir de' : (item.bidsCount ? 'Lance Atual' : 'Lance Inicial')}</p>
                  <p className="text-2xl font-bold text-primary">R$ {(isAuction ? item.initialOffer : item.price)?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0"><Link href={detailUrl}><Eye className="mr-2 h-4 w-4" /> Ver {isAuction ? `Leilão (${item.totalLots})` : 'Detalhes'}</Link></Button>
              </div>
            </div>
          </div>
        </Card>
      </TooltipProvider>

      {isPreviewModalOpen && (isAuction
        ? <AuctionPreviewModal auction={item as Auction} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
        : <LotPreviewModal lot={item as Lot} auction={parentAuction} platformSettings={platformSettings!} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
      )}
    </>
  );
}
