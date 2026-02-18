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
  const validLogoUrl = isValidImageUrl(seller.logoUrl) ? seller.logoUrl! : `https://placehold.co/100x100.png?text=${getSellerInitial(seller.name)}`;
  const formattedDate = seller.createdAt ? format(new Date(seller.createdAt as string), 'MM/yyyy', { locale: ptBR }) : null;
  const SellerIcon = seller.isJudicial ? Scale : Building;

  return (
      <Card className="card-seller" data-ai-id={`seller-card-${seller.id}`}>
        <CardHeader className="header-card-seller" data-ai-id="seller-card-header">
          <Avatar className="avatar-card-seller" data-ai-id="seller-card-avatar">
            <AvatarImage src={validLogoUrl} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || "logo comitente"} />
            <AvatarFallback>{getSellerInitial(seller.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="header-card-seller-title" data-ai-id="seller-card-title">{seller.name}</CardTitle>
          <CardDescription className="desc-card-seller-type" data-ai-id="seller-card-type">
            <SellerIcon className="icon-card-seller-type" />
            {seller.isJudicial ? 'Comitente Judicial' : 'Comitente Verificado'}
          </CardDescription>
        </CardHeader>
        <CardContent className="content-card-seller" data-ai-id="seller-card-content">
          {seller.city && seller.state && (
            <p className="text-card-seller-location">{seller.city} - {seller.state}</p>
          )}
          <div className="text-card-seller-stats">
            <span className="text-card-seller-stats-value">{seller.activeLotsCount || 0}</span> lotes ativos
          </div>
          {formattedDate && (
            <div className="text-card-seller-member-since">
              Membro desde: {formattedDate}
            </div>
          )}
        </CardContent>
        <CardFooter className="footer-card-seller" data-ai-id="seller-card-footer">
          <Button asChild variant="outline" className="btn-card-seller-view-profile" data-ai-id="seller-card-view-btn">
            <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`}>
              Ver Perfil e Lotes <ArrowRight className="icon-btn-action" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
  );
}
