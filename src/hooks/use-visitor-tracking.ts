/**
 * @fileoverview Hook para tracking de visitantes e eventos.
 * 
 * Este hook fornece funções para registrar eventos de visitantes no sistema.
 * O visitante é identificado automaticamente via cookie.
 * 
 * REGRAS DE NEGÓCIO:
 * 1. O cookie do visitante é gerenciado automaticamente pelo backend
 * 2. Eventos duplicados na mesma sessão são ignorados pelo backend
 * 3. Métricas de visualização são atualizadas em tempo real
 * 
 * USO:
 * const { trackLotView, trackAuctionView, trackEvent, getMetrics } = useVisitorTracking();
 * 
 * // Ao visualizar um lote
 * trackLotView(lotId, lotPublicId);
 * 
 * // Ao obter métricas de visualização
 * const metrics = await getMetrics('Lot', lotId);
 */

'use client';

import { useCallback } from 'react';

// Tipos de eventos disponíveis
export type VisitorEventType =
  | 'PAGE_VIEW'
  | 'LOT_VIEW'
  | 'AUCTION_VIEW'
  | 'SEARCH'
  | 'FILTER_APPLIED'
  | 'BID_CLICK'
  | 'SHARE_CLICK'
  | 'FAVORITE_ADD'
  | 'FAVORITE_REMOVE'
  | 'DOCUMENT_DOWNLOAD'
  | 'IMAGE_VIEW'
  | 'VIDEO_PLAY'
  | 'CONTACT_CLICK'
  | 'HABILITATION_START';

// Interface para métricas de visualização
export interface ViewMetrics {
  totalViews: number;
  uniqueViews: number;
  viewsLast24h: number;
  viewsLast7d: number;
  viewsLast30d: number;
  lastViewedAt: string | null;
}

// Interface para metadados de evento
export interface EventMetadata {
  [key: string]: string | number | boolean | null;
}

// Interface para resultado de tracking
interface TrackingResult {
  success: boolean;
  visitorId?: string;
  sessionId?: string;
  isNewVisitor?: boolean;
  isNewSession?: boolean;
  error?: string;
}

// Interface para resposta de métricas
interface MetricsResponse {
  success: boolean;
  metrics?: ViewMetrics;
  error?: string;
}

// Função para obter parâmetros UTM da URL
function getUtmParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

export function useVisitorTracking() {
  /**
   * Registra um evento genérico de visitante
   */
  const trackEvent = useCallback(async (
    eventType: VisitorEventType,
    options?: {
      entityType?: string;
      entityId?: string;
      entityPublicId?: string;
      metadata?: EventMetadata;
    }
  ): Promise<TrackingResult> => {
    try {
      const utmParams = getUtmParams();
      
      const response = await fetch('/api/public/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          entityType: options?.entityType,
          entityId: options?.entityId,
          entityPublicId: options?.entityPublicId,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          metadata: options?.metadata,
          ...utmParams,
        }),
        credentials: 'include', // Importante para enviar/receber cookies
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Tracking error:', data.error);
        return { success: false, error: data.error };
      }

      return {
        success: true,
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        isNewVisitor: data.isNewVisitor,
        isNewSession: data.isNewSession,
      };
    } catch (error) {
      console.error('Error tracking event:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  /**
   * Registra visualização de um lote
   */
  const trackLotView = useCallback(async (
    lotId: string,
    lotPublicId?: string,
    metadata?: EventMetadata
  ): Promise<TrackingResult> => {
    return trackEvent('LOT_VIEW', {
      entityType: 'Lot',
      entityId: lotId,
      entityPublicId: lotPublicId,
      metadata,
    });
  }, [trackEvent]);

  /**
   * Registra visualização de um leilão
   */
  const trackAuctionView = useCallback(async (
    auctionId: string,
    auctionPublicId?: string,
    metadata?: EventMetadata
  ): Promise<TrackingResult> => {
    return trackEvent('AUCTION_VIEW', {
      entityType: 'Auction',
      entityId: auctionId,
      entityPublicId: auctionPublicId,
      metadata,
    });
  }, [trackEvent]);

  /**
   * Registra visualização de página genérica
   */
  const trackPageView = useCallback(async (
    metadata?: EventMetadata
  ): Promise<TrackingResult> => {
    return trackEvent('PAGE_VIEW', { metadata });
  }, [trackEvent]);

  /**
   * Registra busca realizada
   */
  const trackSearch = useCallback(async (
    searchTerm: string,
    resultsCount?: number
  ): Promise<TrackingResult> => {
    return trackEvent('SEARCH', {
      metadata: {
        searchTerm,
        resultsCount: resultsCount ?? null,
      },
    });
  }, [trackEvent]);

  /**
   * Registra clique em dar lance
   */
  const trackBidClick = useCallback(async (
    lotId: string,
    lotPublicId?: string
  ): Promise<TrackingResult> => {
    return trackEvent('BID_CLICK', {
      entityType: 'Lot',
      entityId: lotId,
      entityPublicId: lotPublicId,
    });
  }, [trackEvent]);

  /**
   * Registra compartilhamento
   */
  const trackShare = useCallback(async (
    entityType: 'Lot' | 'Auction',
    entityId: string,
    entityPublicId?: string,
    platform?: string
  ): Promise<TrackingResult> => {
    return trackEvent('SHARE_CLICK', {
      entityType,
      entityId,
      entityPublicId,
      metadata: platform ? { platform } : undefined,
    });
  }, [trackEvent]);

  /**
   * Registra adição aos favoritos
   */
  const trackFavoriteAdd = useCallback(async (
    entityType: 'Lot' | 'Auction',
    entityId: string,
    entityPublicId?: string
  ): Promise<TrackingResult> => {
    return trackEvent('FAVORITE_ADD', {
      entityType,
      entityId,
      entityPublicId,
    });
  }, [trackEvent]);

  /**
   * Registra remoção dos favoritos
   */
  const trackFavoriteRemove = useCallback(async (
    entityType: 'Lot' | 'Auction',
    entityId: string,
    entityPublicId?: string
  ): Promise<TrackingResult> => {
    return trackEvent('FAVORITE_REMOVE', {
      entityType,
      entityId,
      entityPublicId,
    });
  }, [trackEvent]);

  /**
   * Obtém métricas de visualização de uma entidade
   */
  const getMetrics = useCallback(async (
    entityType: string,
    entityId?: string,
    publicId?: string
  ): Promise<MetricsResponse> => {
    try {
      const params = new URLSearchParams({ entityType });
      if (entityId) params.append('entityId', entityId);
      if (publicId) params.append('publicId', publicId);

      const response = await fetch(`/api/public/tracking?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        metrics: data.metrics,
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  /**
   * Obtém métricas de visualização de um lote
   */
  const getLotMetrics = useCallback(async (
    lotId?: string,
    lotPublicId?: string
  ): Promise<MetricsResponse> => {
    return getMetrics('Lot', lotId, lotPublicId);
  }, [getMetrics]);

  /**
   * Obtém métricas de visualização de um leilão
   */
  const getAuctionMetrics = useCallback(async (
    auctionId?: string,
    auctionPublicId?: string
  ): Promise<MetricsResponse> => {
    return getMetrics('Auction', auctionId, auctionPublicId);
  }, [getMetrics]);

  return {
    trackEvent,
    trackLotView,
    trackAuctionView,
    trackPageView,
    trackSearch,
    trackBidClick,
    trackShare,
    trackFavoriteAdd,
    trackFavoriteRemove,
    getMetrics,
    getLotMetrics,
    getAuctionMetrics,
  };
}
