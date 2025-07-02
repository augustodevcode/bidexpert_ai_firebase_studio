
'use client';

import type { Auction } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, MapPin, Tag, DollarSign, Eye, ChevronLeft, ChevronRight, ImageOff, FileText, SlidersHorizontal, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { getAuctionStatusText } from '@/lib/sample-data-helpers'; // CORRECTED IMPORT
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotDescriptionTab from './auction/lot-description-tab';
import LotSpecificationTab from './auction/lot-specification-tab';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Separator } from './ui/separator';

interface AuctionPreviewModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuctionPreviewModal({ auction, isOpen, onClose }: AuctionPreviewModalProps) {
  if (!isOpen) return null;

  const lastStageEndDate = auction.auctionStages && auction.auctionStages.length > 0 
    ? auction.auctionStages[auction.auctionStages.length - 1].endDate 
    : auction.endDate; // fallback to auction.endDate if available

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline">{auction.title}</DialogTitle>
          {auction.fullTitle && <DialogDescription>{auction.fullTitle}</DialogDescription>}
        </DialogHeader>
        
        <div className="relative aspect-video w-full my-4 rounded-md overflow-hidden">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover"
            data-ai-hint={auction.dataAiHint || 'auction item image'}
          />
           {auction.auctioneerLogoUrl && (
            <div className="absolute bottom-2 right-2 bg-background/80 p-1.5 rounded-md shadow-md max-w-[120px] max-h-[60px] overflow-hidden">
              <Image
                src={auction.auctioneerLogoUrl}
                alt={auction.auctioneerName || 'Logo Comitente'}
                width={120}
                height={60}
                className="object-contain h-full w-full"
                data-ai-hint="auctioneer logo large"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center">
            <Info className="h-4 w-4 mr-2 text-primary" /> ID: <span className="font-medium ml-1">{auction.id}</span>
          </div>
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2 text-primary" /> Categoria: <span className="font-medium ml-1">{auction.category}</span>
          </div>
          {auction.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" /> Local: <span className="font-medium ml-1">{auction.location}</span>
            </div>
          )}
          {auction.condition && (
            <div className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Condição: <span className="font-medium ml-1">{auction.condition}</span>
            </div>
          )}
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-primary" /> Oferta Inicial: 
            <span className="font-medium ml-1">
              R$ {(auction.initialOffer || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
           <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-primary" /> Status: 
            <span className="font-medium ml-1">{getAuctionStatusText(auction.status)}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Descrição:</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{auction.description}</p>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-1">Praças do Leilão:</h4>
          <div className="space-y-2">
            {auction.auctionStages && auction.auctionStages.map((stage, index) => (
              <div key={index} className={`p-2.5 rounded-md text-sm border ${new Date(stage.endDate) < new Date() ? 'border-muted text-muted-foreground line-through' : 'border-primary/30 bg-primary/5'}`}>
                <p className="font-medium">{stage.name}</p>
                <p className="text-xs">{stage.statusText || 'Encerramento'}: {format(new Date(stage.endDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm'h'", { locale: ptBR })}</p>
              </div>
            ))}
          </div>
        </div>
        
        {lastStageEndDate && (
             <p className="text-xs text-center text-muted-foreground mb-4">
                Este leilão {new Date(lastStageEndDate) < new Date() ? 'encerrou' : 'encerra'} em {format(new Date(lastStageEndDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
            </p>
        )}


        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button asChild>
            <Link href={`/auctions/${auction.id}`}>Ir para o Leilão</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
