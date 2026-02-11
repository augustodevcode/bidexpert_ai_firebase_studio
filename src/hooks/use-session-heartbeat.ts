/**
 * @fileoverview Hook de Session Heartbeat que mantém a sessão ativa durante leilões.
 * 
 * GAP-FIX: Envia heartbeat a cada 5 minutos e alerta o usuário 5 min antes da
 * expiração da sessão. Evita desconexão durante lances ativos.
 */
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSessionHeartbeatOptions {
  /** Intervalo entre heartbeats em ms (default: 5 min) */
  intervalMs?: number;
  /** Se true, ativa o heartbeat (default: true) */
  enabled?: boolean;
}

export function useSessionHeartbeat(options: UseSessionHeartbeatOptions = {}) {
  const { intervalMs = 5 * 60 * 1000, enabled = true } = options;
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  const sendHeartbeat = useCallback(async () => {
    try {
      const res = await fetch('/api/session/heartbeat', { 
        method: 'POST',
        cache: 'no-store',
      });

      if (res.status === 401) {
        failCountRef.current++;
        if (failCountRef.current >= 2) {
          toast({
            title: 'Sessão Expirando',
            description: 'Sua sessão está prestes a expirar. Salve seu trabalho e faça login novamente.',
            variant: 'destructive',
          });
        }
        return;
      }

      if (res.ok) {
        failCountRef.current = 0;
      }
    } catch {
      failCountRef.current++;
    }
  }, [toast]);

  useEffect(() => {
    if (!enabled) return;

    // Primeiro heartbeat imediato
    sendHeartbeat();

    intervalRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs, sendHeartbeat]);

  return { sendHeartbeat };
}
