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
    <div className="bg-background-light dark:bg-slate-700 rounded-lg p-3 w-16">
        <span className="text-3xl font-bold">{value}</span>
    </div>
    <span className="text-xs mt-1 text-text-light dark:text-text-dark">{label}</span>
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
        <p className="text-lg font-semibold">{getAuctionStatusText(status)}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-4 gap-2 text-center", className)}>
        <TimeSegment value={String(timeRemaining.days).padStart(2, '0')} label="Dias" />
        <TimeSegment value={String(timeRemaining.hours).padStart(2, '0')} label="Horas" />
        <TimeSegment value={String(timeRemaining.minutes).padStart(2, '0')} label="Mins" />
        <TimeSegment value={String(timeRemaining.seconds).padStart(2, '0')} label="Segs" />
    </div>
  );
}
