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
    <section className="section-deal-of-the-day" data-ai-id="deal-of-the-day">
      <div className="container-deal-of-the-day">
        {/* Section header */}
        <div className="wrapper-deal-header" data-ai-id="deal-header">
          <div className="wrapper-deal-title-section">
            <div className="wrapper-deal-icon">
              <Flame className="icon-deal-flame" />
            </div>
            <div className="wrapper-deal-text">
              <h2 className="header-deal-title">{title}</h2>
              {deal.urgencyMessage && (
                <p className="text-deal-urgency">{deal.urgencyMessage}</p>
              )}
            </div>
          </div>

          {/* Countdown */}
          <div className="wrapper-deal-countdown" data-ai-id="deal-countdown">
            <Clock className="icon-deal-clock" />
            <div className="wrapper-countdown-segments">
              {[
                { value: countdown.days, label: 'dias' },
                { value: countdown.hours, label: 'hrs' },
                { value: countdown.minutes, label: 'min' },
                { value: countdown.seconds, label: 'seg' },
              ].map((item, index) => (
                <div key={index} className="wrapper-countdown-item">
                  <div className={cn(
                    "container-countdown-value",
                    isExpired ? "bg-muted-expired" : "bg-active-expired"
                  )}>
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <span className="text-countdown-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deal card */}
        <Card className={cn(
          "card-deal-large",
          isExpired && "card-deal-expired"
        )} data-ai-id="deal-card">
          <CardContent className="content-card-deal">
            <div className="grid-deal-card-layout">
              {/* Image */}
              <div className="wrapper-deal-image-container" data-ai-id="deal-image-wrapper">
                {lot.imageUrl ? (
                  <Image
                    src={lot.imageUrl}
                    alt={lot.title}
                    fill
                    className="img-deal-featured"
                    priority
                  />
                ) : (
                  <div className="wrapper-deal-image-placeholder">
                    <Eye className="icon-deal-placeholder" />
                  </div>
                )}

                {/* Discount badge */}
                <div className="wrapper-deal-discount-badge" data-ai-id="deal-discount">
                  <Badge className="badge-deal-discount">
                    -{deal.discountPercentage}%
                  </Badge>
                </div>

                {/* Status badges */}
                <div className="wrapper-deal-status-badges" data-ai-id="deal-badges">
                  {lot.badges.slice(0, 2).map((badge, index) => (
                    <Badge key={index} variant="secondary" className="badge-deal-status-overlay">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="wrapper-deal-content-info" data-ai-id="deal-info">
                <div className="wrapper-deal-title-pricing">
                  <h3 className="header-deal-lot-title">
                    {lot.title}
                  </h3>

                  {/* Pricing */}
                  <div className="wrapper-deal-pricing" data-ai-id="deal-pricing">
                    <div className="wrapper-original-savings">
                      <span className="text-deal-original-price">
                        {formatCurrency(deal.originalPrice)}
                      </span>
                      <Badge variant="outline" className="badge-deal-savings">
                        <TrendingDown className="icon-deal-savings" />
                        Economize {formatCurrency(savingsAmount)}
                      </Badge>
                    </div>
                    <p className="text-deal-current-price">
                      {formatCurrency(lot.currentPrice)}
                    </p>
                    {lot.minimumPrice && (
                      <p className="text-deal-minimum-price">
                        Lance mínimo: {formatCurrency(lot.minimumPrice)}
                      </p>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="wrapper-deal-progress" data-ai-id="deal-progress">
                    <div className="wrapper-progress-labels">
                      <span className="text-deal-bids-count">
                        {lot.bidsCount} lances realizados
                      </span>
                      <span className="text-deal-demand-high">
                        Alta demanda!
                      </span>
                    </div>
                    <Progress value={soldPercentage} className="progress-deal-demand" />
                  </div>
                </div>

                {/* Actions */}
                <div className="wrapper-deal-actions" data-ai-id="deal-actions">
                  <Button
                    size="lg"
                    className="btn-deal-bid-now"
                    disabled={isExpired}
                    asChild
                    data-ai-id="deal-bid-btn"
                  >
                    <Link href={`/lots/${lot.id}`}>
                      {isExpired ? 'Oferta encerrada' : 'Dar um lance'}
                      {!isExpired && <ArrowRight className="icon-deal-btn-arrow" />}
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="btn-deal-view-more"
                    data-ai-id="deal-view-more-btn"
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
