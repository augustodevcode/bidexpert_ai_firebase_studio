// src/components/lot-countdown.tsx
'use client';

import { useState, useEffect } from 'react';
import { isPast, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAuctionStatusText } from '@/lib/ui-helpers';

interface LotCountdownProps {
  endDate: Date | string | null;
  status: 'ABERTO_PARA_LANCES' | 'EM_BREVE' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'CANCELADO' | 'RASCUNHO';
  className?: string;
}

const TimeSegment = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-bold leading-none">{value}</span>
    <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
  </div>
);

export default function LotCountdown({ endDate, status, className }: LotCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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

      const totalSeconds = differenceInSeconds(end, new Date());
      if (totalSeconds <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate, status, isClient]);

  if (!isClient || !timeRemaining) {
    return (
      <div className={cn("text-center py-2", className)}>
        <p className="text-sm font-semibold text-muted-foreground">{getAuctionStatusText(status)}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex justify-center items-center gap-2 py-1", className)}>
      <TimeSegment value={String(timeRemaining.days).padStart(2, '0')} label="Dias" />
      <span className="text-2xl font-light text-muted-foreground/50">:</span>
      <TimeSegment value={String(timeRemaining.hours).padStart(2, '0')} label="Horas" />
      <span className="text-2xl font-light text-muted-foreground/50">:</span>
      <TimeSegment value={String(timeRemaining.minutes).padStart(2, '0')} label="Min" />
      <span className="text-2xl font-light text-muted-foreground/50">:</span>
      <TimeSegment value={String(timeRemaining.seconds).padStart(2, '0')} label="Seg" />
    </div>
  );
}
