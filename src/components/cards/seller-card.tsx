// src/components/cards/seller-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SellerProfileInfo } from '@/types';
import { isValidImageUrl } from '@/lib/ui-helpers';
import { ArrowRight, Star, Building, Scale } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SellerCardProps {
  seller: SellerProfileInfo;
  onUpdate?: () => void;
}

const getSellerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
};

export default function SellerCard({ seller, onUpdate }: SellerCardProps) {
  if (!seller || !seller.id) {
    console.warn('SellerCard recebeu dados inválidos:', seller);
    return null;
  }

  const validLogoUrl = isValidImageUrl(seller.logoUrl) ? seller.logoUrl! : `https://placehold.co/100x100.png?text=${getSellerInitial(seller.name)}`;
  const formattedDate = seller.createdAt ? format(new Date(seller.createdAt as string), 'MM/yyyy', { locale: ptBR }) : null;
  const SellerIcon = seller.isJudicial ? Scale : Building;

  return (
      <Card className="shadow-md hover:shadow-xl transition-shadow flex flex-col h-full" data-ai-id={`seller-card-${seller.id}`}>
        <CardHeader className="items-center text-center p-4" data-ai-id={`seller-card-header-${seller.id}`}>
          <Avatar className="h-24 w-24 mb-3 border-2 border-primary/30">
            <AvatarImage src={validLogoUrl} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || "logo comitente"} />
            <AvatarFallback>{getSellerInitial(seller.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-xl font-semibold" data-ai-id={`seller-card-title-${seller.id}`}>{seller.name}</CardTitle>
          <CardDescription className="text-xs text-primary flex items-center gap-1" data-ai-id={`seller-card-type-${seller.id}`}>
            <SellerIcon className="h-3.5 w-3.5" />
            {seller.isJudicial ? 'Comitente Judicial' : 'Comitente Verificado'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow px-4 pb-4 space-y-1 text-sm text-muted-foreground text-center" data-ai-id={`seller-card-content-${seller.id}`}>
          {seller.city && seller.state && (
            <p className="text-xs">{seller.city} - {seller.state}</p>
          )}
          <div className="text-xs">
            <span className="font-medium text-foreground">{seller.activeLotsCount || 0}</span> lotes ativos
          </div>
          {formattedDate && (
            <div className="text-xs">
              Membro desde: {formattedDate}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t" data-ai-id={`seller-card-footer-${seller.id}`}>
          <Button asChild variant="outline" className="w-full" data-ai-id={`seller-view-profile-btn-${seller.id}`}>
            <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`}>
              Ver Perfil e Lotes <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
  );
}
