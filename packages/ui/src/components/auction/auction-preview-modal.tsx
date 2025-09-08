// packages/ui/src/components/auction/auction-preview-modal.tsx
'use client';

import type { Auction } from '@bidexpert/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import Image from 'next/image';
import { CalendarDays, MapPin, Eye, ChevronLeft, ChevronRight, ImageOff, FileText, ListChecks, Landmark } from 'lucide-react';
import Link from 'next/link';
import AuctionStagesTimeline from './auction-stages-timeline';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { isValidImageUrl } from '../../lib/ui-helpers';

interface AuctionPreviewModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuctionPreviewModal({ auction, isOpen, onClose }: AuctionPreviewModalProps) {
  if (!isOpen) return null;

  const getAuctioneerInitial = () => {
    const name = auction.auctioneerName || auction.auctioneer?.name;
    if (name && typeof name === 'string') {
      return name.charAt(0).toUpperCase();
    }
    return 'L';
  };
  
  const auctioneerInitial = getAuctioneerInitial();
  const displayLocation = auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'Nacional';
  
  const validImageUrl = isValidImageUrl(auction.imageUrl) ? auction.imageUrl : 'https://placehold.co/600x400.png';

  const auctionDates = useMemo(() => {
    const dates: Date[] = [];
    if (auction.auctionDate) dates.push(new Date(auction.auctionDate as string));
    if (auction.endDate) dates.push(new Date(auction.endDate as string));
    (auction.auctionStages || []).forEach(stage => {
        if (stage.endDate) dates.push(new Date(stage.endDate as string));
    });
    const uniqueDates = Array.from(new Set(dates.map(d => d.toISOString()))).map(iso => new Date(iso));
    return uniqueDates;
  }, [auction]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold font-headline">{auction.title}</DialogTitle>
          <DialogDescription>
            Leilão do tipo {auction.auctionType || 'Não especificado'} em {displayLocation}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto px-4 sm:px-6">
            <div className="space-y-4">
                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                    <Image
                        src={validImageUrl}
                        alt={auction.title}
                        fill
                        className="object-cover"
                        data-ai-hint={auction.dataAiHint || 'auction item image'}
                    />
                </div>
                 <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-md font-semibold flex items-center"><Landmark className="mr-2 h-4 w-4" /> Leiloeiro e Comitente</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-sm space-y-2">
                        <div className="flex items-center gap-2">
                           <Avatar className="h-9 w-9 border">
                             <AvatarImage src={auction.auctioneer?.logoUrl || ''} alt={auction.auctioneerName || ''} data-ai-hint={auction.auctioneer?.dataAiHintLogo || 'leiloeiro logo'}/>
                             <AvatarFallback>{auctioneerInitial}</AvatarFallback>
                           </Avatar>
                           <div>
                            <p className="text-xs text-muted-foreground">Leiloeiro</p>
                            <p className="font-semibold">{auction.auctioneer?.name || auction.auctioneerName}</p>
                           </div>
                        </div>
                         <div className="border-t border-dashed my-1"></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Comitente/Vendedor</p>
                            <p className="font-semibold">{auction.seller?.name || 'Não informado'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-md font-semibold flex items-center"><ListChecks className="mr-2 h-4 w-4"/>Lotes e Visitas</CardTitle>
                    </CardHeader>
                     <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2 text-center">
                        <div className="bg-accent/40 p-2 rounded-md">
                            <p className="text-xl font-bold">{auction.totalLots || 0}</p>
                            <p className="text-xs text-muted-foreground">Lotes</p>
                        </div>
                         <div className="bg-accent/40 p-2 rounded-md">
                            <p className="text-xl font-bold">{auction.visits || 0}</p>
                            <p className="text-xs text-muted-foreground">Visitas</p>
                        </div>
                    </CardContent>
                </Card>
                 <AuctionStagesTimeline stages={auction.auctionStages || []} />
                 <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-md font-semibold flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Calendário</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center p-0">
                        <Calendar
                            mode="multiple"
                            selected={auctionDates}
                            defaultMonth={auction.auctionDate ? new Date(auction.auctionDate as string) : new Date()}
                            className="p-2"
                            classNames={{
                                cell: "h-8 w-8 text-center text-xs p-0 relative",
                                day: "h-8 w-8 p-0",
                                head_cell: "w-8",
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
        
        <DialogFooter className="p-4 sm:p-6 border-t bg-background flex justify-between w-full flex-shrink-0">
            <Button variant="outline" onClick={onClose}> Fechar </Button>
            <Button asChild>
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Leilão Completo
                </Link>
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
