
'use client';

import type { Auction, AuctionStage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, FileText, Landmark, Eye } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Calendar } from './ui/calendar';
import AuctionStagesTimeline from './auction/auction-stages-timeline';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';

interface AuctionPreviewModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuctionPreviewModal({ auction, isOpen, onClose }: AuctionPreviewModalProps) {
  if (!isOpen) return null;

  const auctioneerInitial = auction.auctioneer ? auction.auctioneer.charAt(0).toUpperCase() : 'L';
  const displayLocation = auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'Nacional';
  
  const auctionDates = useMemo(() => {
    const dates: Date[] = [];
    if (auction.auctionDate) dates.push(new Date(auction.auctionDate as string));
    if (auction.endDate) dates.push(new Date(auction.endDate as string));
    (auction.auctionStages || []).forEach(stage => {
        if (stage.endDate) dates.push(new Date(stage.endDate as string));
    });
    return dates;
  }, [auction]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold font-headline">{auction.title}</DialogTitle>
          <DialogDescription>
            {auction.description ? auction.description.substring(0,100) + '...' : `Leilão do tipo ${auction.auctionType} em ${displayLocation}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto px-4 sm:px-6">
            <div className="space-y-4">
                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                    <Image
                        src={auction.imageUrl || 'https://placehold.co/600x400.png'}
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
                             <AvatarImage src={auction.auctioneerLogoUrl || ''} alt={auction.auctioneerName || ''} data-ai-hint={auction.dataAiHint || 'leiloeiro logo'}/>
                             <AvatarFallback>{auctioneerInitial}</AvatarFallback>
                           </Avatar>
                           <div>
                            <p className="text-xs text-muted-foreground">Leiloeiro</p>
                            <p className="font-semibold">{auction.auctioneer}</p>
                           </div>
                        </div>
                         <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground">Comitente/Vendedor</p>
                            <p className="font-semibold">{auction.seller}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <AuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages || []} />
                 <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-md font-semibold flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Calendário do Leilão</CardTitle>
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
        
        <DialogFooter className="p-4 sm:p-6 border-t bg-background sticky bottom-0 flex justify-between w-full">
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
