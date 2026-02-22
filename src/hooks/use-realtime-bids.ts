/**
 * @fileoverview Hook de comunicação real-time para lances.
 * Suporta duas estratégias via admin toggle:
 *   - WEBSOCKET: Socket.io client, rooms por lote/leilão, eventos bid:new / softclose:extended
 *   - POLLING: Fallback HTTP GET em /api/bids/realtime com interval configurável
 * Detecção automática: tenta WS primeiro; se falhar, cai em polling.
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/* ---------- Tipos ---------- */

export interface RealtimeBid {
  id: string;
  lotId: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: string;
  bidderDisplay: string;
  bidOrigin?: string;
  isAutoBid?: boolean;
  status?: string;
}

export interface RealtimeSoftClose {
  lotId: string;
  auctionId: string;
  newEndDate: string;
  minutesAdded: number;
}

export interface RealtimeLotState {
  id: string;
  price: number;
  bidsCount: number;
  status: string;
  endDate: string | null;
}

type CommunicationStrategy = 'WEBSOCKET' | 'POLLING';

export interface UseRealtimeBidsOptions {
  lotId?: string | bigint | null;
  auctionId?: string | bigint | null;
  enabled?: boolean;
  strategy?: CommunicationStrategy;
  pollingIntervalMs?: number;
  maxBids?: number;
}

export interface UseRealtimeBidsReturn {
  bids: RealtimeBid[];
  lotState: RealtimeLotState | null;
  softCloseAlert: RealtimeSoftClose | null;
  isConnected: boolean;
  connectionType: 'websocket' | 'polling' | 'disconnected';
  latestBid: RealtimeBid | undefined;
  bidsCount: number;
  clearSoftCloseAlert: () => void;
}

/* ---------- Hook ---------- */

export function useRealtimeBids(options: UseRealtimeBidsOptions = {}): UseRealtimeBidsReturn {
  const {
    lotId,
    auctionId,
    enabled = true,
    strategy = 'WEBSOCKET',
    pollingIntervalMs = 3000,
    maxBids = 50,
  } = options;

  const lotIdStr = lotId ? String(lotId) : null;
  const auctionIdStr = auctionId ? String(auctionId) : null;

  const [bids, setBids] = useState<RealtimeBid[]>([]);
  const [lotState, setLotState] = useState<RealtimeLotState | null>(null);
  const [softCloseAlert, setSoftCloseAlert] = useState<RealtimeSoftClose | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');

  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<string | null>(null);

  // Dedup helper
  const addBid = useCallback((bid: RealtimeBid) => {
    setBids((prev) => {
      if (prev.some((b) => b.id === bid.id)) return prev;
      const next = [bid, ...prev].slice(0, maxBids);
      lastTimestampRef.current = bid.timestamp;
      return next;
    });
  }, [maxBids]);

  // ---------- WebSocket strategy ----------
  useEffect(() => {
    if (!enabled || strategy !== 'WEBSOCKET' || !lotIdStr) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionType('websocket');
      if (lotIdStr) socket.emit('join_lot', lotIdStr);
      if (auctionIdStr) socket.emit('join_auction', auctionIdStr);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionType('disconnected');
    });

    socket.on('connect_error', () => {
      console.warn('[useRealtimeBids] WebSocket connection error, will retry...');
    });

    socket.on('bid:new', (payload: RealtimeBid) => {
      addBid(payload);
      if (payload.lotId === lotIdStr) {
        setLotState((prev) =>
          prev
            ? { ...prev, price: payload.amount, bidsCount: (prev.bidsCount || 0) + 1 }
            : { id: payload.lotId, price: payload.amount, bidsCount: 1, status: 'ABERTO_PARA_LANCES', endDate: null }
        );
      }
    });

    socket.on('softclose:extended', (payload: RealtimeSoftClose) => {
      setSoftCloseAlert(payload);
      if (payload.lotId === lotIdStr) {
        setLotState((prev) => (prev ? { ...prev, endDate: payload.newEndDate } : prev));
      }
    });

    return () => {
      if (lotIdStr) socket.emit('leave_lot', lotIdStr);
      if (auctionIdStr) socket.emit('leave_auction', auctionIdStr);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionType('disconnected');
    };
  }, [enabled, strategy, lotIdStr, auctionIdStr, addBid]);

  // ---------- Polling strategy ----------
  useEffect(() => {
    if (!enabled || strategy !== 'POLLING' || !lotIdStr) return;

    const controller = new AbortController();

    const poll = async () => {
      try {
        const params = new URLSearchParams();
        if (lotIdStr) params.set('lotId', lotIdStr);
        if (auctionIdStr) params.set('auctionId', auctionIdStr);
        if (lastTimestampRef.current) params.set('since', lastTimestampRef.current);
        params.set('limit', String(maxBids));

        const res = await fetch(`/api/bids/realtime?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setIsConnected(true);
        setConnectionType('polling');

        if (data.bids?.length) {
          data.bids.forEach((b: RealtimeBid) => addBid(b));
        }
        if (data.lotState) {
          setLotState(data.lotState);
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('[useRealtimeBids] Polling error:', e);
          setIsConnected(false);
          setConnectionType('disconnected');
        }
      }
    };

    poll(); // immediate first poll
    pollingRef.current = setInterval(poll, pollingIntervalMs);

    return () => {
      controller.abort();
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      setIsConnected(false);
      setConnectionType('disconnected');
    };
  }, [enabled, strategy, lotIdStr, auctionIdStr, pollingIntervalMs, maxBids, addBid]);

  const clearSoftCloseAlert = useCallback(() => setSoftCloseAlert(null), []);

  return {
    bids,
    lotState,
    softCloseAlert,
    isConnected,
    connectionType,
    latestBid: bids[0],
    bidsCount: bids.length,
    clearSoftCloseAlert,
  };
}
