// src/hooks/use-realtime-bids.ts
'use client';
import { useEffect, useState, useCallback } from 'react';
import type { BidEvent, SoftCloseEvent } from '@/services/realtime-bids.service';

interface UseRealtimeBidsOptions {
  lotId?: bigint | string;
  auctionId?: bigint | string;
  enabled?: boolean;
}

export function useRealtimeBids(options: UseRealtimeBidsOptions = {}) {
  const { lotId, auctionId, enabled = true } = options;
  const [bids, setBids] = useState<BidEvent[]>([]);
  const [softCloseAlert, setSoftCloseAlert] = useState<SoftCloseEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Client-side only: listen to events via fetch-based polling or custom event system
  // For production, use Socket.io or native WebSocket
  useEffect(() => {
    if (!enabled || !lotId) return;

    const controller = new AbortController();
    const lotIdStr = String(lotId);

    // Simple polling approach for now (production should use WebSocket)
    const pollInterval = setInterval(async () => {
      try {
        // This would call a real API endpoint that returns recent bids
        // const response = await fetch(`/api/lots/${lotIdStr}/bids/latest?limit=10`, {
        //   signal: controller.signal,
        // });
        // const newBids = await response.json();
        // setBids(prev => [...newBids, ...prev].slice(0, 20));
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('Polling error:', e);
        }
      }
    }, 1000);

    setIsConnected(true);

    return () => {
      clearInterval(pollInterval);
      controller.abort();
      setIsConnected(false);
    };
  }, [lotId, enabled]);

  const getLatestBid = useCallback((): BidEvent | undefined => {
    return bids[0];
  }, [bids]);

  const getBidsCount = useCallback((): number => {
    return bids.length;
  }, [bids]);

  return {
    bids,
    softCloseAlert,
    isConnected,
    getLatestBid,
    getBidsCount,
  };
}
