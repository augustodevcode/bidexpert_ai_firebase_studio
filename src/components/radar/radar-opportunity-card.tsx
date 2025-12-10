// src/components/radar/radar-opportunity-card.tsx
/**
 * @fileoverview Card de oportunidade para o Radar de Leilões.
 * Exibe um lote com foto, informações de demanda e countdown.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Eye, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RadarOpportunityCardProps {
  lot: Lot;
  auction?: Auction;
  platformSettings: PlatformSettings;
  className?: string;
}

export default function RadarOpportunityCard({ lot, auction, className }: RadarOpportunityCardProps) {
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const numberFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  React.useEffect(() => {
    setIsFavorite(isLotFavoriteInStorage(lot.id.toString()));
  }, [lot.id]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const lotIdStr = lot.id.toString();
    if (isFavorite) {
      removeFavoriteLotIdFromStorage(lotIdStr);
      setIsFavorite(false);
      toast({ title: 'Removido dos favoritos' });
    } else {
      addFavoriteLotIdToStorage(lotIdStr);
      setIsFavorite(true);
      toast({ title: 'Adicionado aos favoritos', description: 'Você receberá alertas sobre este lote.' });
    }
  };

  const deadlineLabel = lot.endDate
    ? formatDistanceToNowStrict(new Date(lot.endDate), { locale: ptBR, addSuffix: false })
    : 'Sem data';

  const totalBids = (() => {
    const value = (lot as Record<string, unknown>)?.['bidCount'] ?? (lot as Record<string, unknown>)?.['totalBids'];
    return typeof value === 'number' ? value : 0;
  })();

  const demandScore = Math.min(100, ((lot.views || 0) / 50) * 10 + totalBids * 5);
  const priceLabel = numberFormatter.format(lot.price || 0);

  // Calcular urgência
  const isUrgent = lot.endDate && new Date(lot.endDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const isHot = demandScore > 60;

  const lotImage = lot.imageUrl || lot.galleryImageUrls?.[0] || 'https://placehold.co/400x300.png';

  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow group', className)}>
      <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
        <div className="relative">
          {/* Imagem do Lote */}
          <div className="relative h-48 w-full bg-muted">
            <Image
              src={lotImage}
              alt={lot.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={lot.dataAiHint || 'lote leilão'}
            />
            {/* Overlay com badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Badges de status */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {isUrgent && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Urgente
                </Badge>
              )}
              {isHot && (
                <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Em alta
                </Badge>
              )}
            </div>

            {/* Botão favorito */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background',
                isFavorite && 'text-destructive'
              )}
              onClick={handleFavoriteToggle}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            </Button>

            {/* Info do leilão */}
            {auction?.auctionDate && (
              <div className="absolute bottom-2 left-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Leilão {format(new Date(auction.auctionDate), 'dd/MM HH:mm')}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Categoria */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {lot.categoryName || 'Lote'}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {lot.views || 0} visualizações
              </span>
            </div>

            {/* Título */}
            <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
              {lot.title}
            </h3>

            {/* Descrição curta */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {lot.description?.slice(0, 100) || 'Detalhes disponíveis na página do lote.'}
            </p>

            {/* Preço e Score */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lance atual</span>
                <span className="font-bold text-lg text-primary">{priceLabel}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Score de demanda</span>
                  <span>{Math.round(demandScore)}%</span>
                </div>
                <Progress value={demandScore} className="h-1.5" />
              </div>

              <Badge variant="secondary" className="w-full justify-center py-1.5">
                <Clock className="h-3 w-3 mr-1" />
                Encerra em {deadlineLabel}
              </Badge>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}
