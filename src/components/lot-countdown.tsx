/**
 * @fileoverview Countdown para lotes com Traffic Light Timer (Verde→Amarelo→Vermelho)
 * e Pulse Effect nos últimos 60 segundos. Sincronização de timestamp com servidor.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { isPast, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAuctionStatusText } from '@/lib/ui-helpers';

interface LotCountdownProps {
  endDate: Date | string | null;
  status: 'ABERTO_PARA_LANCES' | 'EM_BREVE' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'CANCELADO' | 'RASCUNHO';
  className?: string;
  variant?: 'card' | 'detail';
}

/**
 * GAP-FIX: Traffic Light Timer - retorna classe de cor baseada no tempo restante
 * > 1h = verde, 15min-1h = amarelo, < 15min = vermelho, < 60s = vermelho pulsante
 */
function getTrafficLightColor(totalSeconds: number, variant: 'card' | 'detail'): string {
  if (totalSeconds <= 60) {
    return variant === 'card'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 animate-pulse'
      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 animate-pulse';
  }
  if (totalSeconds <= 900) { // < 15 min
    return variant === 'card'
      ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
      : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300';
  }
  if (totalSeconds <= 3600) { // < 1h
    return variant === 'card'
      ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300';
  }
  // > 1h
  return variant === 'card'
    ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300';
}

const TimeSegment = ({ value, label, variant, colorClass }: { value: string; label: string; variant: 'card' | 'detail'; colorClass: string }) => (
  <div className="flex flex-col items-center">
    <div className={cn("rounded-lg font-mono", colorClass,
        variant === 'card' ? 'p-2 w-14' : 'p-3 w-16'
    )}>
        <span className="text-3xl font-bold tabular-nums">{value}</span>
    </div>
    <span className="text-xs mt-1 text-text-light dark:text-text-dark">{label}</span>
  </div>
);

export default function LotCountdown({ endDate, status, className, variant = 'detail' }: LotCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number, hours: number, minutes: number, seconds: number, totalSeconds: number } | null>(null);
  const [isClient, setIsClient] = useState(false);
  // GAP-FIX: Server time offset para sincronização de timestamp
  const serverTimeOffsetRef = useRef<number>(0);

  useEffect(() => {
    setIsClient(true);
    // Tentar buscar offset do servidor (fallback: 0 se não disponível)
    fetch('/api/server-time', { method: 'GET', cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data?.serverTime) {
          serverTimeOffsetRef.current = new Date(data.serverTime).getTime() - Date.now();
        }
      })
      .catch(() => { /* Fallback: sem offset */ });
  }, []);

  useEffect(() => {
    if (!endDate || !isClient) return;

    const end = new Date(endDate);
    if (isNaN(end.getTime())) return;

    const calculateTime = () => {
      if (isPast(end) || status !== 'ABERTO_PARA_LANCES') {
        setTimeRemaining(null);
        return;
      }

      // GAP-FIX: Usa offset do servidor para cálculo mais preciso
      const adjustedNow = new Date(Date.now() + serverTimeOffsetRef.current);
      const totalSeconds = differenceInSeconds(end, adjustedNow);
      if (totalSeconds <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeRemaining({ days, hours, minutes, seconds, totalSeconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate, status, isClient]);

  if (!isClient || !timeRemaining) {
    return (
      <div className={cn("text-center py-2", className)} data-ai-id="lot-countdown-status">
        <p className="text-lg font-semibold">{getAuctionStatusText(status)}</p>
      </div>
    );
  }

  // GAP-FIX: Traffic Light color baseada no totalSeconds
  const colorClass = getTrafficLightColor(timeRemaining.totalSeconds, variant);

  return (
    <div className={cn("grid grid-cols-4 gap-2 text-center", className)} data-ai-id="lot-countdown-timer">
        <TimeSegment variant={variant} value={String(timeRemaining.days).padStart(2, '0')} label="Dias" colorClass={colorClass} />
        <TimeSegment variant={variant} value={String(timeRemaining.hours).padStart(2, '0')} label="Horas" colorClass={colorClass} />
        <TimeSegment variant={variant} value={String(timeRemaining.minutes).padStart(2, '0')} label="Mins" colorClass={colorClass} />
        <TimeSegment variant={variant} value={String(timeRemaining.seconds).padStart(2, '0')} label="Segs" colorClass={colorClass} />
    </div>
  );
}
