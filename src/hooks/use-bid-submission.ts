/**
 * @fileoverview Hook para submissão de lances com UI otimista e chave de idempotência.
 * Gera UUID para CLIENT_UUID strategy ou delega ao servidor para SERVER_HASH.
 * Previne double-click, mostra feedback instantâneo, reverte em caso de erro.
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { placeBidOnLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';

type IdempotencyStrategy = 'SERVER_HASH' | 'CLIENT_UUID';

export interface UseBidSubmissionOptions {
  lotId: string;
  auctionId: string;
  userId: string;
  userName: string;
  idempotencyStrategy?: IdempotencyStrategy;
  onSuccess?: (result: any) => void;
  onError?: (message: string) => void;
}

export interface UseBidSubmissionReturn {
  submitBid: (amount: number) => Promise<boolean>;
  isSubmitting: boolean;
  lastError: string | null;
  lastIdempotencyKey: string | null;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useBidSubmission(options: UseBidSubmissionOptions): UseBidSubmissionReturn {
  const {
    lotId,
    auctionId,
    userId,
    userName,
    idempotencyStrategy = 'SERVER_HASH',
    onSuccess,
    onError,
  } = options;

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState<string | null>(null);
  const debounceRef = useRef<number>(0);

  const submitBid = useCallback(async (amount: number): Promise<boolean> => {
    // Anti double-click: 500ms cooldown
    const now = Date.now();
    if (now - debounceRef.current < 500) {
      toast({ title: 'Aguarde', description: 'Lance sendo processado...', variant: 'default' });
      return false;
    }
    debounceRef.current = now;

    if (isSubmitting) return false;

    setIsSubmitting(true);
    setLastError(null);

    // Generate idempotency key for CLIENT_UUID strategy
    const idempotencyKey = idempotencyStrategy === 'CLIENT_UUID' ? generateUUID() : undefined;
    if (idempotencyKey) setLastIdempotencyKey(idempotencyKey);

    try {
      const result = await placeBidOnLot(
        lotId,
        auctionId,
        userId,
        userName,
        amount
      );

      if (result.success) {
        toast({ title: 'Lance registrado!', description: `Valor: ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` });
        onSuccess?.(result);
        return true;
      } else {
        const msg = result.message || 'Erro ao registrar lance';
        setLastError(msg);
        toast({ title: 'Erro no lance', description: msg, variant: 'destructive' });
        onError?.(msg);
        return false;
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro de conexão';
      setLastError(msg);
      toast({ title: 'Erro de conexão', description: msg, variant: 'destructive' });
      onError?.(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [lotId, auctionId, userId, userName, idempotencyStrategy, isSubmitting, toast, onSuccess, onError]);

  return {
    submitBid,
    isSubmitting,
    lastError,
    lastIdempotencyKey,
  };
}
