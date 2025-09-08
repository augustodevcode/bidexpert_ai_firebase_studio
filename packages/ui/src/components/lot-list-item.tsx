// packages/ui/src/components/lot-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, BadgeVisibilitySettings, MentalTriggerSettings, PlatformSettings } from '@bidexpert/core';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, MapPin, Gavel, Tag, Truck, Building, Car, Info, Leaf } from 'lucide-react';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, isValidImageUrl, getActiveStage, getLotPriceForStage } from '../lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import EntityEditMenu from './entity-edit-menu';
import LotPreviewModal from './lot-preview-modal';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@bidexpert/core';
import { Skeleton } from './ui/skeleton';

interface LotListItemProps {
  lot: Lot;
  auction?: Auction;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

function LotListItemClientContent({ lot, auction, platformSettings, onUpdate }: LotListItemProps) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const { userProfileWithPermissions } = useAuth();
  
  const hasEditPermission = hasPermission(userProfileWithPermissions, 'manage_all');
  
  const { effectiveLotEndDate } = React.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = React.useMemo(() => getActiveStage(auction?.auctionStages), [auction]);
  const activeLotPrices = React.useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';
  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
  
  const inheritedBem = (lot.inheritedMediaFromBemId && lot.bens) ? lot.bens.find(b => b.id === lot.inheritedMediaFromBemId) : null;
  const imageUrlToDisplay = inheritedBem ? inheritedBem.imageUrl : lot.imageUrl;

  const getTypeIcon = (type?: string) => {
    if (!type) {
      return <Info className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    const upperType = type.toUpperCase();
    if (upperType.includes('CASA') || upperType.includes('IMÓVEL') || upperType.includes('APARTAMENTO')) {
        return <Building className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    if (upperType.includes('VEÍCULO') || upperType.includes('AUTOMÓVEL') || upperType.includes('CARRO')) {
        return <Car className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    if (upperType.includes('MAQUINÁRIO') || upperType.includes('TRATOR')) {
        return <Truck className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return <Info className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden" data-ai-id={`lot-list-item-container-${lot.id}`}>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
            <Link href={lotDetailUrl} className="block h-full w-full">
              <Image
                src={isValidImageUrl(imageUrlToDisplay) ? imageUrlToDisplay! : 'https://placehold.co/600x400.png'}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
                data-ai-id={`lot-list-item-image-${lot.id}`}
              />
            </Link>
          </div>
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <div className="flex items-center gap-2 mb-1" data-ai-id={`lot-list-item-badges-${lot.id}`}>
                     <Badge className={`text-xs px-1.5 py-0.5 ${getLotStatusColor(lot.status)}`}>
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                </div>
                <Link href={lotDetailUrl}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={lot.title} data-ai-id={`lot-list-item-title-${lot.id}`}>
                    Lote {lot.number || lot.id.replace('LOTE','')} - {lot.title}
                  </h3>
                </Link>
              </div>
              {hasEditPermission && <EntityEditMenu entityType="lot" entityId={lot.id} publicId={lot.publicId} currentTitle={lot.title} isFeatured={lot.isFeatured || false} onUpdate={onUpdate} />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2" data-ai-id={`lot-list-item-details-${lot.id}`}>
              <div className="flex items-center" title={`Categoria: ${lot.type}`}>{getTypeIcon(lot.type)}<span className="truncate ml-1">{lot.type}</span></div>
              <div className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate" title={displayLocation}>{displayLocation}</span></div>
              <div className="flex items-center"><Gavel className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{lot.bidsCount || 0} Lances</span></div>
              <div className="flex items-center"><Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" /><span className="truncate">{lot.views || 0} Visitas</span></div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lot.description}</p>
            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed" data-ai-id={`lot-list-item-footer-${lot.id}`}>
              <div>
                <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
                <p className={`text-xl font-bold ${effectiveLotEndDate && isPast(effectiveLotEndDate) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {(activeLotPrices?.initialBid ?? lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
               <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
                    <Link href={lotDetailUrl}><Eye className="mr-2 h-4 w-4" /> Ver Detalhes</Link>
                </Button>
            </div>
          </div>
        </div>
      </Card>
      <LotPreviewModal
        lot={lot}
        auction={auction}
        platformSettings={platformSettings}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
  );
}

export function LotListItem(props: LotListItemProps) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true); }, []);

    if (!isClient) {
      return (
        <Card className="flex flex-row overflow-hidden h-full shadow-md rounded-lg group">
             <div className="relative aspect-square h-full bg-muted animate-pulse w-1/3 md:w-1/4 flex-shrink-0"></div>
             <div className="flex flex-col flex-grow">
                <CardContent className="p-4 flex-grow space-y-1.5">
                    <Skeleton className="h-5 bg-muted rounded w-3/4" />
                    <Skeleton className="h-4 bg-muted rounded w-1/2" />
                    <Skeleton className="h-4 bg-muted rounded w-full" />
                    <Skeleton className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
                <div className="p-4 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex-grow">
                        <Skeleton className="h-4 bg-muted rounded w-1/4" />
                        <Skeleton className="h-6 bg-muted rounded w-1/2 mt-1" />
                    </div>
                    <Skeleton className="h-9 bg-muted rounded w-full md:w-auto" />
                </div>
             </div>
        </Card>
      );
    }
    return <LotListItemClientContent {...props} />;
  }
