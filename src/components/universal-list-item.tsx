
// src/components/universal-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Tag, MapPin, Gavel, Users, Clock, ListChecks, Heart, Share2, Pencil } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import { getAuctionStatusText, isValidImageUrl, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AuctionStagesTimeline from './auction/auction-stages-timeline';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import EntityEditMenu from './entity-edit-menu';
import * as icons from 'lucide-react';

type Item = Partial<Auction & Lot>;

interface UniversalListItemProps {
  item: Item;
  type: 'auction' | 'lot';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

// Helper to render an icon dynamically by its name
const IconByName = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const IconComponent = (icons as any)[name];
    if (!IconComponent) return null; // Or return a default icon
    return <IconComponent {...props} />;
};

export default function UniversalListItem({ item, type, platformSettings, parentAuction, onUpdate }: UniversalListItemProps) {
  if (!item) return null;

  const isAuction = type === 'auction';
  const detailUrl = isAuction
    ? `/auctions/${item.publicId || item.id}`
    : `/auctions/${item.auctionId}/lots/${item.publicId || item.id}`;

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

  const mainImageUrl = isValidImageUrl(item.imageUrl) ? item.imageUrl! : `https://placehold.co/600x400.png?text=${isAuction ? 'Leilão' : 'Lote'}`;
  const sellerInfo = isAuction ? (item as Auction).seller : parentAuction?.seller;
  const sellerLogoUrl = isValidImageUrl(sellerInfo?.logoUrl) ? sellerInfo?.logoUrl : undefined;
  const auctioneerInfo = isAuction ? (item as Auction).auctioneer : parentAuction?.auctioneer;
  const auctionTypeDisplay = getAuctionTypeDisplayData(item.auctionType as Auction['auctionType']);

  const renderAuctionDetails = () => {
    const auctionItem = item as Auction;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2" data-ai-id="auction-list-item-details">
        {auctionTypeDisplay?.label && (
          <div className="flex items-center">
            {auctionTypeDisplay.iconName && <IconByName name={auctionTypeDisplay.iconName} className="h-3.5 w-3.5 mr-1.5 text-primary/80" />}
            <span>{auctionTypeDisplay.label}</span>
          </div>
        )}
        <div className="flex items-center"><ListChecks className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span>{auctionItem.totalLots || 0} Lotes</span></div>
        <div className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{auctionItem.city} - {auctionItem.state}</span></div>
        <div className="flex items-center"><Users className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{auctionItem.totalHabilitatedUsers || 0} Habilitados</span></div>
      </div>
    );
  };

  const renderLotDetails = () => {
    const lotItem = item as Lot;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2" data-ai-id="lot-list-item-details">
        <div className="flex items-center"><Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span>{lotItem.type || 'Não especificada'}</span></div>
        <div className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{lotItem.cityName} - {lotItem.stateUf}</span></div>
        <div className="flex items-center"><Gavel className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span>{lotItem.bidsCount || 0} Lances</span></div>
        <div className="flex items-center"><Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span>{lotItem.views || 0} Visitas</span></div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card data-ai-id={`${type}-list-item-card-${item.id}`} className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-auto bg-muted">
            <Link href={detailUrl} className="block h-full w-full">
              <Image src={mainImageUrl} alt={item.title!} fill className="object-cover" data-ai-hint={item.dataAiHint || `${type} image list`} />
            </Link>
            {sellerLogoUrl && (
              <Tooltip>
                <TooltipTrigger asChild><Link href={sellerInfo?.slug ? `/sellers/${sellerInfo.slug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-1 right-1 z-10"><Avatar className="h-10 w-10 border-2 bg-background border-border shadow-md"><AvatarImage src={sellerLogoUrl} alt={sellerInfo?.name || "Logo"} data-ai-hint={sellerInfo?.dataAiHintLogo || 'logo comitente'} /><AvatarFallback>{sellerInfo?.name ? sellerInfo.name.charAt(0) : 'S'}</AvatarFallback></Avatar></Link></TooltipTrigger>
                <TooltipContent><p>Comitente: {sellerInfo?.name}</p></TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs px-1.5 py-0.5 shadow-sm`}>{getAuctionStatusText(item.status)}</Badge>
                  {mentalTriggers.map(trigger => <Badge key={trigger} variant="secondary" className="text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300">{trigger}</Badge>)}
                </div>
                <Link href={detailUrl}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={item.title!}>{isAuction ? item.title : `Lote ${item.number} - ${item.title}`}</h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`ID: ${item.publicId || item.id}`}>ID: {item.publicId || item.id}</p>
              </div>
              <EntityEditMenu entityType={type} entityId={item.id!} publicId={item.publicId!} currentTitle={item.title!} isFeatured={item.isFeatured || item.isFeaturedOnMarketplace || false} onUpdate={onUpdate} />
            </div>
            {isAuction ? renderAuctionDetails() : renderLotDetails()}
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
              <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0"><Link href={detailUrl}><Eye className="mr-2 h-4 w-4" /> Ver {isAuction ? `Leilão (${item.totalLots})` : 'Lote'}</Link></Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
