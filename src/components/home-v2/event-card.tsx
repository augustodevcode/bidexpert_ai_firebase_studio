/**
 * @file EventCard Component
 * @description Card component for displaying auction events with
 * consignor info, dates, status, and lot counts.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Users, ChevronRight, Gavel, Radio } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FeaturedEvent } from './types';

interface EventCardProps {
  event: FeaturedEvent;
  variant?: 'default' | 'compact' | 'featured';
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  EVENTO_UNICO: 'Evento Único',
  PRIMEIRA_PRACA: '1ª Praça',
  SEGUNDA_PRACA: '2ª Praça',
  LEILAO_ONLINE: 'Leilão Online',
  ELETRONICO: 'Eletrônico',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  ABERTO_PARA_LANCES: { label: 'Aberto para Lances', variant: 'default', icon: Gavel },
  EM_BREVE: { label: 'Em Breve', variant: 'secondary', icon: Clock },
  ENCERRADO: { label: 'Encerrado', variant: 'outline', icon: Clock },
};

export default function EventCard({ event, variant = 'default' }: EventCardProps) {
  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.EM_BREVE;
  const StatusIcon = statusConfig.icon;
  const isLive = event.status === 'ABERTO_PARA_LANCES';

  const formatEventDate = (date: Date) => {
    return format(new Date(date), "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  const getTimeInfo = () => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (isPast(end)) {
      return { text: 'Encerrado', isUrgent: false };
    }
    if (isFuture(start)) {
      return { 
        text: `Inicia ${formatDistanceToNow(start, { locale: ptBR, addSuffix: true })}`,
        isUrgent: false 
      };
    }
    const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    return { 
      text: `Encerra ${formatDistanceToNow(end, { locale: ptBR, addSuffix: true })}`,
      isUrgent: hoursLeft < 24 
    };
  };

  const timeInfo = getTimeInfo();

  if (variant === 'compact') {
    return (
      <Link href={`/auctions/${event.id}`} data-testid={`event-card-${event.id}`}>
        <Card className="group hover:shadow-md hover:border-primary/50 transition-all h-full">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={event.consignorLogo} alt={event.consignor} />
                <AvatarFallback>{event.consignor.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <p className="text-xs text-muted-foreground">{event.consignor}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={statusConfig.variant} className="text-xs">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {event.lotsCount} lotes
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/auctions/${event.id}`} data-testid={`event-card-${event.id}`}>
      <Card className={cn(
        "group overflow-hidden hover:shadow-lg transition-all h-full",
        "hover:border-primary/50 hover:-translate-y-1",
        isLive && "ring-2 ring-destructive/50"
      )}>
        {/* Image */}
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Gavel className="h-12 w-12 text-primary/40" />
            </div>
          )}
          
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <Badge 
              variant={statusConfig.variant} 
              className={cn(
                "shadow-md",
                isLive && "animate-pulse"
              )}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Event type */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
            </Badge>
          </div>

          {/* Consignor */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-background shadow-md">
              <AvatarImage src={event.consignorLogo} alt={event.consignor} />
              <AvatarFallback className="text-xs">{event.consignor.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-white drop-shadow-md bg-black/30 px-2 py-0.5 rounded">
              {event.consignor}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {event.title}
          </h3>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {formatEventDate(event.startDate)} - {formatEventDate(event.endDate)}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span>{event.lotsCount} lotes disponíveis</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <span className={cn(
              "text-xs font-medium",
              timeInfo.isUrgent ? "text-destructive" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3 inline mr-1" />
              {timeInfo.text}
            </span>
            <Button variant="ghost" size="sm" className="group-hover:text-primary">
              Ver evento <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
