/**
 * @file LotCard Component
 * @description Card component for displaying lots with segment-specific
 * attributes, badges, pricing, and countdown.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, MapPin, Eye, Heart, HeartOff, ChevronRight,
  Gauge, Calendar, Building2, Ruler, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LotCardData, SegmentType, LotBadge } from './types';

interface LotCardProps {
  lot: LotCardData;
  segmentType: SegmentType;
  variant?: 'default' | 'compact' | 'featured';
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
}

const BADGE_VARIANTS: Record<LotBadge['type'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  CONDICIONAL: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  VENDIDO: { variant: 'outline', className: 'bg-gray-100 text-gray-600' },
  ABERTO: { variant: 'default' },
  EM_PROPOSTA: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  FINANCIAVEL: { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-300' },
  DESTAQUE: { variant: 'default', className: 'bg-primary' },
  URGENTE: { variant: 'destructive' },
};

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ --';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function CountdownTimer({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      if (isPast(new Date(endDate))) {
        setTimeLeft('Encerrado');
        return;
      }
      setTimeLeft(formatDistanceToNow(new Date(endDate), { locale: ptBR, addSuffix: true }));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return <span>{timeLeft}</span>;
}

export default function LotCard({ 
  lot, 
  segmentType, 
  variant = 'default',
  onFavoriteToggle 
}: LotCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const isEnded = lot.endDate ? isPast(new Date(lot.endDate)) : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavoriteToggle?.(lot.id, !isFavorite);
  };

  // Segment-specific details
  const renderSegmentDetails = () => {
    switch (segmentType) {
      case 'veiculos':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lot.brand && lot.model && (
              <span className="truncate">{lot.brand} {lot.model}</span>
            )}
            {lot.year && <span>{lot.year}</span>}
            {lot.mileage !== undefined && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {lot.mileage.toLocaleString('pt-BR')} km
              </span>
            )}
            {lot.licensePlate && (
              <span>Final {lot.licensePlate.slice(-1)}</span>
            )}
          </div>
        );

      case 'imoveis':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lot.propertyType && <span>{lot.propertyType}</span>}
            {lot.area && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {lot.area}m²
              </span>
            )}
            {lot.city && lot.state && (
              <span className="flex items-center gap-1 col-span-2">
                <MapPin className="h-3 w-3" />
                {lot.city}, {lot.state}
              </span>
            )}
            {lot.stage && <span>Praça: {lot.stage}</span>}
            {lot.occupationStatus && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {lot.occupationStatus}
              </span>
            )}
          </div>
        );

      case 'maquinas':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lot.machineType && <span>{lot.machineType}</span>}
            {lot.manufacturer && <span>{lot.manufacturer}</span>}
            {lot.year && <span>Ano: {lot.year}</span>}
            {lot.hoursWorked !== undefined && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lot.hoursWorked.toLocaleString('pt-BR')}h
              </span>
            )}
          </div>
        );

      case 'tecnologia':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lot.techBrand && <span>{lot.techBrand}</span>}
            {lot.techModel && <span>{lot.techModel}</span>}
            {lot.condition && <span>Condição: {lot.condition}</span>}
            {lot.hasWarranty && (
              <Badge variant="outline" className="text-xs w-fit">
                Com garantia
              </Badge>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (variant === 'compact') {
    return (
      <Link href={`/lots/${lot.id}`} data-testid={`lot-card-${lot.id}`}>
        <Card className="group hover:shadow-md hover:border-primary/50 transition-all h-full">
          <CardContent className="p-3">
            <div className="flex gap-3">
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                {lot.imageUrl ? (
                  <Image
                    src={lot.imageUrl}
                    alt={lot.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Eye className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {lot.title}
                </h3>
                <p className="text-primary font-bold text-sm mt-1">
                  {formatCurrency(lot.currentPrice)}
                </p>
                {lot.bidsCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {lot.bidsCount} {lot.bidsCount === 1 ? 'lance' : 'lances'}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/lots/${lot.id}`} data-testid={`lot-card-${lot.id}`}>
      <Card className={cn(
        "group overflow-hidden hover:shadow-lg transition-all h-full",
        "hover:border-primary/50 hover:-translate-y-1",
        isEnded && "opacity-75"
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {lot.imageUrl ? (
            <Image
              src={lot.imageUrl}
              alt={lot.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Eye className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-50px)]">
            {lot.badges.map((badge, index) => {
              const badgeConfig = BADGE_VARIANTS[badge.type];
              return (
                <Badge 
                  key={index} 
                  variant={badgeConfig.variant}
                  className={cn("text-xs shadow-sm", badgeConfig.className)}
                >
                  {badge.label}
                </Badge>
              );
            })}
          </div>

          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
              "hover:bg-background",
              isFavorite && "text-destructive"
            )}
            onClick={handleFavoriteClick}
          >
            {isFavorite ? (
              <Heart className="h-4 w-4 fill-current" />
            ) : (
              <HeartOff className="h-4 w-4" />
            )}
          </Button>

          {/* Status overlay */}
          {isEnded && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="outline" className="text-sm bg-background">
                Encerrado
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {lot.title}
          </h3>

          {/* Segment-specific details */}
          <div className="mb-3">
            {renderSegmentDetails()}
          </div>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Lance atual</span>
              {lot.evaluationPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(lot.evaluationPrice)}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(lot.currentPrice)}
            </p>
            {lot.minimumPrice && lot.minimumPrice < lot.currentPrice && (
              <p className="text-xs text-muted-foreground">
                Mínimo: {formatCurrency(lot.minimumPrice)}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex items-center justify-between w-full text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              {lot.bidsCount > 0 && (
                <span>{lot.bidsCount} {lot.bidsCount === 1 ? 'lance' : 'lances'}</span>
              )}
              {lot.endDate && !isEnded && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <CountdownTimer endDate={new Date(lot.endDate)} />
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
