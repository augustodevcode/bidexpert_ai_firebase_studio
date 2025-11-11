// src/app/auctions/[auctionId]/hooks/use-auction-countdown.ts
/**
 * @fileoverview Hook para gerenciar countdown em tempo real do leilão e seus estágios.
 * Fornece informações sobre tempo restante, estágio ativo, e status de expiração.
 */
import { useState, useEffect, useMemo } from 'react';
import { differenceInSeconds, isPast, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Auction } from '@/types';

interface AuctionCountdownData {
  timeRemaining: string;           // Ex: "2h 45m 30s"
  timeRemainingSeconds: number;    // Total segundos
  isExpired: boolean;
  isExpiringSoon: boolean;         // < 1 hora
  stage?: {
    name: string;
    startDate: Date;
    endDate: Date;
    stageNumber: number;
  };
  progress: number;                 // 0-100% do leilão
}

export function useAuctionCountdown(auction: Auction): AuctionCountdownData {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);

  const activeStage = useMemo(() => {
    if (!auction.auctionStages?.length) return null;
    
    const now = new Date();
    return auction.auctionStages.find(stage => 
      new Date(stage.startDate) <= now && new Date(stage.endDate) >= now
    ) || auction.auctionStages[auction.auctionStages.length - 1];
  }, [auction.auctionStages]);

  const { isExpired, isExpiringSoon, progress } = useMemo(() => {
    if (!activeStage) return { isExpired: true, isExpiringSoon: false, progress: 100 };

    const endDate = new Date(activeStage.endDate);
    const expired = isPast(endDate);
    
    const secondsRemaining = differenceInSeconds(endDate, new Date());
    const expiringSoon = secondsRemaining < 3600; // 1 hora
    
    // Progress baseado no estágio
    const startDate = new Date(activeStage.startDate);
    const totalSeconds = differenceInSeconds(endDate, startDate);
    const elapsedSeconds = differenceInSeconds(new Date(), startDate);
    const progress = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

    return { isExpired: expired, isExpiringSoon: expiringSoon, progress };
  }, [activeStage]);

  useEffect(() => {
    if (isExpired) {
      setTimeRemaining('Expirado');
      setTimeRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      if (!activeStage) return;

      const endDate = new Date(activeStage.endDate);
      const now = new Date();
      
      if (isPast(endDate)) {
        setTimeRemaining('Expirado');
        setTimeRemainingSeconds(0);
        clearInterval(interval);
        return;
      }

      const seconds = differenceInSeconds(endDate, now);
      setTimeRemainingSeconds(seconds);

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${secs}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${secs}s`);
      } else {
        setTimeRemaining(`${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeStage, isExpired]);

  return {
    timeRemaining,
    timeRemainingSeconds,
    isExpired,
    isExpiringSoon,
    stage: activeStage ? {
      name: activeStage.name,
      startDate: new Date(activeStage.startDate),
      endDate: new Date(activeStage.endDate),
      stageNumber: 1,
    } : undefined,
    progress,
  };
}
