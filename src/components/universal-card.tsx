
// src/components/universal-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction, Lot, PlatformSettings } from '@/types';
import { Heart, Share2, Eye, MapPin, Gavel, Users, Clock, Star, ListChecks, Tag, Pencil, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal';
import AuctionPreviewModal from './auction-preview-modal';
import { getAuctionStatusText, getLotStatusColor, isValidImageUrl, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from './entity-edit-menu';
import AuctionStagesTimeline from './auction/auction-stages-timeline';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as icons from 'lucide-react';

type Item = Partial<Auction & Lot>;

// Helper to render an icon dynamically by its name
const IconByName = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const IconComponent = (icons as any)[name];
    if (!IconComponent) return null; // Or return a default icon
    return <IconComponent {...props} />;
};


interface UniversalCardProps {
  item: Item;
  type: 'auction' | 'lot';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

export default function UniversalCard({ item, type, platformSettings, parentAuction, onUpdate }: UniversalCardProps) {
  const { userProfileWithPermissions } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [itemFullUrl, setItemFullUrl] = React.useState<string>('');


  const hasEditPermission = hasPermission(userProfileWithPermissions, 'manage_all');
  const isAuction = type === 'auction';

  const soldLotsCount = React.useMemo(() => {
    if (!isAuction || !item.lots || item.lots.length === 0) return 0;
    return item.lots.filter(lot => lot.status === 'VENDIDO').length;
  }, [isAuction, item.lots]);

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

  const detailUrl = React.useMemo(() => isAuction
    ? `/auctions/${item.publicId || item.id}`
    : `/auctions/${item.auctionId}/lots/${item.publicId || item.id}`, [isAuction, item]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setItemFullUrl(`${window.location.origin}${detailUrl}`);
    }
  }, [detailUrl]);

  React.useEffect(() => {
    if (!isAuction && item.id) {
        setIsFavorite(isLotFavoriteInStorage(item.id));
    }
  }, [item.id, isAuction]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuction || !item.id) return;
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (newFavoriteState) addFavoriteLotIdToStorage(item.id);
    else removeFavoriteLotIdFromStorage(item.id);
    toast({ title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos" });
  };

  const openPreviewModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const mainImageUrl = isValidImageUrl(item.imageUrl) ? item.imageUrl! : 'https://placehold.co/600x400.png';
  const itemTitle = item.title || 'Item sem título';
  const dataAiHint = item.dataAiHint || `${type} image`;

  const getStatusDisplay = () => {
    const status = item.status || 'RASCUNHO';
    if (isAuction) {
      const typedStatus = status as Auction['status'];
      if (typedStatus === 'ENCERRADO' || typedStatus === 'FINALIZADO') {
        return soldLotsCount > 0
          ? { text: `Vendido (${soldLotsCount}/${item.totalLots})`, className: 'bg-green-600 text-white' }
          : { text: 'Finalizado (Sem Venda)', className: 'bg-gray-500 text-white' };
      }
      return { text: getAuctionStatusText(typedStatus), className: getLotStatusColor(typedStatus) };
    } else {
      return { text: getAuctionStatusText(status), className: getLotStatusColor(status) };
    }
  };
  const statusDisplay = getStatusDisplay();
  const auctionTypeDisplay = getAuctionTypeDisplayData(item.auctionType as Auction['auctionType']);
  
  const sellerInfo = isAuction ? (item as Auction).seller : parentAuction?.seller;
  const sellerLogoUrl = isValidImageUrl(sellerInfo?.logoUrl) ? sellerInfo?.logoUrl : undefined;

  const renderAuctionContent = () => (
    <CardContent className="p-4 flex-grow" data-ai-id="auction-card-content">
      <div className="flex justify-between items-start text-xs text-muted-foreground mb-1">
        <span className="truncate" title={`ID: ${item.publicId || item.id}`} data-ai-id="auction-card-public-id">ID: {item.publicId || item.id}</span>
        {auctionTypeDisplay && (
          <div className="flex items-center gap-1" data-ai-id="auction-card-type">
             {auctionTypeDisplay.iconName && <IconByName name={auctionTypeDisplay.iconName} className="h-3 w-3" />}
            <span>{auctionTypeDisplay.label}</span>
          </div>
        )}
      </div>
      <h3 data-ai-id="auction-card-title" className="text-md font-semibold hover:text-primary transition-colors mb-2 leading-tight min-h-[2.5em] line-clamp-2">{item.title}</h3>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground mb-2" data-ai-id="auction-card-counters">
        <div className="flex items-center" title={`${item.totalLots || 0} Lotes`}><ListChecks className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary/80" /><span className="truncate">{item.totalLots || 0} Lotes</span></div>
        <div className="flex items-center" title={`${item.visits || 0} Visitas`}><Eye className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary/80" /><span className="truncate">{item.visits || 0} Visitas</span></div>
        <div className="flex items-center" title={`${item.totalHabilitatedUsers || 0} Habilitados`}><Users className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary/80" /><span className="truncate">{item.totalHabilitatedUsers || 0} Habilitados</span></div>
        <div className="flex items-center gap-1" title={`Localização: ${item.city || ''} - ${item.state || ''}`}>
          <MapPin className="h-3.5 w-3.5 mr-0.5 shrink-0 text-primary/80" />
          <span className="truncate">{item.city || 'N/A'}</span>
           {item.latitude && item.longitude && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                <MapPin className="h-3 w-3" />
              </a>
           )}
        </div>
      </div>
       {(item as Auction).auctionStages && ((item as Auction).auctionStages!.length > 0) && (
        <div className="space-y-1 mb-3 text-xs" data-ai-id="auction-card-timeline">
          <AuctionStagesTimeline auctionOverallStartDate={new Date(item.auctionDate as string)} stages={(item as Auction).auctionStages!} />
        </div>
      )}
    </CardContent>
  );

  const renderLotContent = () => (
    <CardContent className="p-3 flex-grow space-y-1.5" data-ai-id="lot-card-content">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1" data-ai-id="lot-card-category"><Tag className="h-3 w-3" /><span>{item.type}</span></div>
        <div className="flex items-center gap-1" data-ai-id="lot-card-bid-count"><Gavel className="h-3 w-3" /><span>{item.bidsCount || 0} Lances</span></div>
      </div>
      <h3 data-ai-id="lot-card-title" className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">Lote {item.number || ''} - {item.title}</h3>
      <div className="flex items-center text-xs text-muted-foreground" data-ai-id="lot-card-location">
        <MapPin className="h-3 w-3 mr-1" />
        <span className="truncate">{item.cityName} - {item.stateUf}</span>
        {item.latitude && item.longitude && (
           <a href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
             <MapPin className="h-3 w-3" />
           </a>
        )}
      </div>
    </CardContent>
  );

  return (
    <>
      <Card data-ai-id={`${type}-card-${item.id}`} className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group">
        <div className="relative">
          <Link href={detailUrl} className="block">
            <div className="aspect-[16/10] relative bg-muted">
              <Image src={mainImageUrl} alt={itemTitle} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" data-ai-hint={dataAiHint} />
              {sellerLogoUrl && (
                <TooltipProvider><Tooltip><TooltipTrigger asChild><Link href={sellerInfo!.slug ? `/sellers/${sellerInfo!.slug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-2 right-2 z-10"><Avatar className="h-12 w-12 border-2 bg-background border-border shadow-md"><AvatarImage src={sellerLogoUrl} alt={sellerInfo!.name || ''} data-ai-hint={sellerInfo?.dataAiHintLogo || 'logo comitente'} /><AvatarFallback>{sellerInfo!.name ? sellerInfo.name.charAt(0) : 'S'}</AvatarFallback></Avatar></Link></TooltipTrigger><TooltipContent><p>Comitente: {sellerInfo!.name}</p></TooltipContent></Tooltip></TooltipProvider>
              )}
            </div>
          </Link>
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10" data-ai-id="card-status-badges"><Badge className={`text-xs px-2 py-1 ${statusDisplay.className}`}>{statusDisplay.text}</Badge></div>
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10" data-ai-id="card-mental-triggers">{mentalTriggers.map(trigger => <Badge key={trigger} variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">{trigger.startsWith('ENCERRA') && <Clock className="h-3 w-3 mr-0.5" />}{trigger}</Badge>)}</div>
          <div className="absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 transform-gpu flex-row items-center justify-center space-x-1.5 opacity-0 transition-all duration-300 group-hover:-translate-y-0 group-hover:opacity-100 translate-y-4">
            <TooltipProvider>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"} disabled={isAuction}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={openPreviewModal} aria-label="Pré-visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" aria-label="Compartilhar"><Share2 className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger></TooltipTrigger>
                        <TooltipContent><p>Compartilhar</p></TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild><a href={getSocialLink('x', itemFullUrl, itemTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><X className="h-3.5 w-3.5" /> X (Twitter)</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('facebook', itemFullUrl, itemTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><Facebook className="h-3.5 w-3.5" /> Facebook</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', itemFullUrl, itemTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><MessageSquareText className="h-3.5 w-3.5" /> WhatsApp</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('email', itemFullUrl, itemTitle)} className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5" /> Email</a></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                {hasEditPermission && <EntityEditMenu entityType={type} entityId={item.id!} publicId={item.publicId!} currentTitle={item.title!} isFeatured={item.isFeatured || item.isFeaturedOnMarketplace || false} onUpdate={onUpdate} />}
            </TooltipProvider>
          </div>
        </div>
        {isAuction ? renderAuctionContent() : renderLotContent()}
        <CardFooter className="p-4 border-t flex-col items-start space-y-2" data-ai-id={`${type}-card-footer`}>
          {isAuction && item.initialOffer !== undefined && <div className="w-full"><p className="text-xs text-muted-foreground">{item.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor de Referência' : 'A partir de'}</p><p className="text-2xl font-bold text-primary">R$ {item.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>}
          {!isAuction && item.price !== undefined && <div className="w-full"><p className="text-xs text-muted-foreground">{item.bidsCount && item.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p><p className="text-2xl font-bold text-primary">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>}
          <Button asChild className="w-full mt-2"><Link href={detailUrl}>Ver {isAuction ? `Lotes (${item.totalLots || 0})` : 'Detalhes'}</Link></Button>
        </CardFooter>
      </Card>
      {isPreviewModalOpen && (isAuction
        ? <AuctionPreviewModal auction={item as Auction} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
        : <LotPreviewModal lot={item as Lot} auction={parentAuction} platformSettings={platformSettings} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
      )}
    </>
  );
}
