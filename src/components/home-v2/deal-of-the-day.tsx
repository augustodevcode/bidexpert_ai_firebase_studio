/**
 * @file DealOfTheDay Component
 * @description Featured deal section with countdown timer, large card,
 * and urgency messaging. Inspired by Martfury's deal of the day.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Flame, TrendingDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DealOfTheDay as DealOfTheDayType, SegmentType } from './types';

interface DealOfTheDayProps {
  deal: DealOfTheDayType | null;
  segmentId: SegmentType;
  title?: string;
}

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endDate: Date): CountdownValues {
  const difference = new Date(endDate).getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DealOfTheDay({
  deal,
  segmentId,
  title = 'Oferta Imperdível de Hoje',
}: DealOfTheDayProps) {
  const [countdown, setCountdown] = useState<CountdownValues>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!deal) return;

    const updateCountdown = () => {
      setCountdown(calculateTimeLeft(deal.endsAt));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deal]);

  if (!deal) return null;

  const { lot } = deal;
  const isExpired =
    countdown.days === 0 &&
    countdown.hours === 0 &&
    countdown.minutes === 0 &&
    countdown.seconds === 0;

  const savingsAmount = deal.originalPrice - lot.currentPrice;
  const soldPercentage = Math.min((lot.bidsCount / 20) * 100, 95); // Simulated progress

  return (
    <section className="py-10 md:py-14 bg-gradient-to-r from-primary/5 via-background to-primary/5" data-testid="deal-of-the-day">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Flame className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
              {deal.urgencyMessage && (
                <p className="text-muted-foreground text-sm">{deal.urgencyMessage}</p>
              )}
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-destructive" />
            <div className="flex gap-1">
              {[
                { value: countdown.days, label: 'dias' },
                { value: countdown.hours, label: 'hrs' },
                { value: countdown.minutes, label: 'min' },
                { value: countdown.seconds, label: 'seg' },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={cn(
                    "min-w-[3rem] px-2 py-1 rounded-md font-mono font-bold text-xl",
                    isExpired ? "bg-muted text-muted-foreground" : "bg-destructive text-destructive-foreground"
                  )}>
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deal card */}
        <Card className={cn(
          "overflow-hidden",
          isExpired && "opacity-60"
        )}>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative aspect-[4/3] md:aspect-auto bg-muted">
                {lot.imageUrl ? (
                  <Image
                    src={lot.imageUrl}
                    alt={lot.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Eye className="h-16 w-16 text-primary/40" />
                  </div>
                )}

                {/* Discount badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-destructive text-lg px-3 py-1 font-bold">
                    -{deal.discountPercentage}%
                  </Badge>
                </div>

                {/* Status badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {lot.badges.slice(0, 2).map((badge, index) => (
                    <Badge key={index} variant="secondary" className="bg-background/90">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 line-clamp-2">
                    {lot.title}
                  </h3>

                  {/* Pricing */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground line-through text-lg">
                        {formatCurrency(deal.originalPrice)}
                      </span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Economize {formatCurrency(savingsAmount)}
                      </Badge>
                    </div>
                    <p className="text-4xl md:text-5xl font-bold text-primary">
                      {formatCurrency(lot.currentPrice)}
                    </p>
                    {lot.minimumPrice && (
                      <p className="text-sm text-muted-foreground">
                        Lance mínimo: {formatCurrency(lot.minimumPrice)}
                      </p>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {lot.bidsCount} lances realizados
                      </span>
                      <span className="font-medium text-destructive">
                        Alta demanda!
                      </span>
                    </div>
                    <Progress value={soldPercentage} className="h-2" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={isExpired}
                    asChild
                  >
                    <Link href={`/lots/${lot.id}`}>
                      {isExpired ? 'Oferta encerrada' : 'Dar um lance'}
                      {!isExpired && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/${segmentId}?urgente=true`}>
                      Ver mais ofertas
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
