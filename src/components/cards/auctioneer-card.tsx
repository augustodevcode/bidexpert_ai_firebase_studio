// src/components/cards/auctioneer-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AuctioneerProfileInfo } from '@/types';
import { isValidImageUrl } from '@/lib/ui-helpers';
import { Landmark, ArrowRight, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuctioneerCardProps {
  auctioneer: AuctioneerProfileInfo;
  onUpdate?: () => void;
}

const getAuctioneerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'A';
};


export default function AuctioneerCard({ auctioneer, onUpdate }: AuctioneerCardProps) {
  const validLogoUrl = isValidImageUrl(auctioneer.logoUrl) ? auctioneer.logoUrl! : `https://placehold.co/100x100.png?text=${getAuctioneerInitial(auctioneer.name)}`;
  const formattedDate = auctioneer.createdAt ? format(new Date(auctioneer.createdAt as string), 'MM/yyyy', { locale: ptBR }) : null;


  return (
      <Card className="shadow-md hover:shadow-xl transition-shadow flex flex-col h-full">
        <CardHeader className="items-center text-center p-4">
          <Avatar className="h-24 w-24 mb-3 border-2 border-primary/30">
            <AvatarImage src={validLogoUrl} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo || "logo leiloeiro"} />
            <AvatarFallback>{getAuctioneerInitial(auctioneer.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-xl font-semibold">{auctioneer.name}</CardTitle>
          <CardDescription className="text-xs text-primary">{auctioneer.registrationNumber || 'Leiloeiro Credenciado'}</CardDescription>
          {auctioneer.rating !== undefined && auctioneer.rating > 0 && (
            <div className="flex items-center text-xs text-amber-600 mt-1">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-1" />
              {auctioneer.rating.toFixed(1)}
              <span className="text-muted-foreground ml-1">({Math.floor(Math.random() * 100 + (auctioneer.auctionsConductedCount || 0))} avaliações)</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-grow px-4 pb-4 space-y-1 text-sm text-muted-foreground text-center">
          {auctioneer.city && auctioneer.state && (
            <p className="text-xs">{auctioneer.city} - {auctioneer.state}</p>
          )}
          <div className="text-xs">
            <span className="font-medium text-foreground">{auctioneer.auctionsConductedCount || 0}+</span> leilões conduzidos
          </div>
          {formattedDate && (
            <div className="text-xs">
              Membro desde: {formattedDate}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/auctioneers/${auctioneer.slug || auctioneer.publicId || auctioneer.id}`}>
              Ver Perfil e Leilões <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
  );
}
