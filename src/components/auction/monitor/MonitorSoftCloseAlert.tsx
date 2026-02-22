/**
 * @fileoverview Alerta visual de soft-close com countdown animado.
 * Exibe quando o leilão estende o prazo por lance nos últimos minutos.
 * Cores: verde (>5min) → amarelo (2-5min) → vermelho (<2min)
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RealtimeSoftClose } from '@/hooks/use-realtime-bids';

interface MonitorSoftCloseAlertProps {
  softCloseEvent: RealtimeSoftClose | null;
  endDate: string | Date | null | undefined;
  onDismiss?: () => void;
}

function getTimeLeft(endDate: string | Date | null | undefined): number {
  if (!endDate) return 0;
  return Math.max(0, new Date(endDate).getTime() - Date.now());
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

type UrgencyLevel = 'safe' | 'warning' | 'critical';

function getUrgency(ms: number): UrgencyLevel {
  const minutes = ms / 60000;
  if (minutes > 5) return 'safe';
  if (minutes > 2) return 'warning';
  return 'critical';
}

const URGENCY_STYLES: Record<UrgencyLevel, { bg: string; text: string; icon: string; border: string }> = {
  safe:     { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-500', border: 'border-emerald-200' },
  warning:  { bg: 'bg-amber-50 dark:bg-amber-950/30',    text: 'text-amber-700 dark:text-amber-400',     icon: 'text-amber-500',   border: 'border-amber-200' },
  critical: { bg: 'bg-red-50 dark:bg-red-950/30',         text: 'text-red-700 dark:text-red-400',         icon: 'text-red-500',     border: 'border-red-200' },
};

export default function MonitorSoftCloseAlert({ softCloseEvent, endDate, onDismiss }: MonitorSoftCloseAlertProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endDate));
  const [showAlert, setShowAlert] = useState(false);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft(getTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(tick);
  }, [endDate]);

  // Show alert when soft-close event fires
  useEffect(() => {
    if (softCloseEvent) {
      setShowAlert(true);
      const timer = setTimeout(() => {
        setShowAlert(false);
        onDismiss?.();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [softCloseEvent, onDismiss]);

  const urgency = getUrgency(timeLeft);
  const styles = URGENCY_STYLES[urgency];

  return (
    <div data-ai-id="monitor-softclose-alert" className="space-y-2">
      {/* Soft-close extension banner */}
      {showAlert && softCloseEvent && (
        <div
          data-ai-id="monitor-softclose-banner"
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-lg border animate-in slide-in-from-top-2 duration-300',
            'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
          )}
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Prazo estendido! +{softCloseEvent.minutesAdded} min
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Lance nos últimos minutos ativou a prorrogação automática
            </p>
          </div>
          <Timer className="h-5 w-5 text-amber-500" />
        </div>
      )}

      {/* Countdown display */}
      {timeLeft > 0 && (
        <div
          data-ai-id="monitor-countdown-bar"
          className={cn(
            'flex items-center justify-between px-4 py-2 rounded-lg border',
            styles.bg, styles.border
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className={cn('h-4 w-4', styles.icon, urgency === 'critical' && 'animate-pulse')} />
            <span className={cn('text-sm font-bold', styles.text)}>
              {urgency === 'critical' ? 'Encerrando!' : urgency === 'warning' ? 'Atenção' : 'Tempo restante'}
            </span>
          </div>
          <span
            data-ai-id="monitor-countdown-value"
            className={cn(
              'text-xl font-black tabular-nums tracking-tight',
              styles.text,
              urgency === 'critical' && 'animate-pulse'
            )}
          >
            {formatTimeLeft(timeLeft)}
          </span>
        </div>
      )}
    </div>
  );
}
