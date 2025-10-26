// src/hooks/use-bidder-dashboard.ts
/**
 * @fileoverview Hooks customizados para o dashboard do arrematante
 * Gerencia estado e operações do bidder dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BidderDashboardOverview,
  WonLot,
  PaymentMethod,
  BidderNotification,
  ParticipationHistory,
  WonLotsFilters,
  NotificationsFilters,
  ParticipationHistoryFilters,
  WonLotsSortField,
  NotificationsSortField,
  ParticipationHistorySortField,
  ApiResponse,
  PaginatedResponse,
  SortConfig
} from '@/types/bidder-dashboard';

// -----------------------------
// Dashboard Overview Hook
// -----------------------------
export function useBidderDashboard() {
  const [overview, setOverview] = useState<BidderDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bidder/dashboard');
      const result: ApiResponse<BidderDashboardOverview> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar dados do dashboard');
      }

      setOverview(result.data!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const refresh = useCallback(() => {
    return fetchOverview();
  }, [fetchOverview]);

  return {
    overview,
    loading,
    error,
    refresh
  };
}

// -----------------------------
// Won Lots Hook
// -----------------------------
export function useWonLots() {
  const [wonLots, setWonLots] = useState<WonLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<WonLot>['pagination'] | null>(null);
  const [filters, setFilters] = useState<WonLotsFilters>({});
  const [sort, setSort] = useState<SortConfig<WonLotsSortField>>({
    field: 'wonAt',
    direction: 'desc'
  });

  const fetchWonLots = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(sort).map(([key, value]) => [key, value])
        ),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, value])
        )
      });

      const response = await fetch(`/api/bidder/won-lots?${params}`);
      const result: ApiResponse<any> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar lotes arrematados');
      }

      setWonLots(result.data.data);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => {
    fetchWonLots();
  }, [fetchWonLots]);

  const loadMore = useCallback(async () => {
    if (pagination?.hasNext) {
      await fetchWonLots(pagination.page + 1);
    }
  }, [pagination, fetchWonLots]);

  const refresh = useCallback(() => {
    return fetchWonLots(1);
  }, [fetchWonLots]);

  return {
    wonLots,
    loading,
    error,
    pagination,
    filters,
    sort,
    setFilters,
    setSort,
    loadMore,
    refresh
  };
}

// -----------------------------
// Payment Methods Hook
// -----------------------------
export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bidder/payment-methods');
      const result: ApiResponse<any> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar métodos de pagamento');
      }

      setPaymentMethods(result.data.methods);
      setDefaultMethod(result.data.defaultMethod);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const createMethod = useCallback(async (data: any): Promise<ApiResponse<PaymentMethod>> => {
    try {
      const response = await fetch('/api/bidder/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        await fetchPaymentMethods(); // Refresh list
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [fetchPaymentMethods]);

  const updateMethod = useCallback(async (id: string, data: any): Promise<ApiResponse<PaymentMethod>> => {
    try {
      const response = await fetch(`/api/bidder/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        await fetchPaymentMethods(); // Refresh list
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [fetchPaymentMethods]);

  const deleteMethod = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`/api/bidder/payment-methods/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchPaymentMethods(); // Refresh list
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [fetchPaymentMethods]);

  const setDefault = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`/api/bidder/payment-methods/${id}/set-default`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        await fetchPaymentMethods(); // Refresh list
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [fetchPaymentMethods]);

  const refresh = useCallback(() => {
    return fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    defaultMethod,
    loading,
    error,
    createMethod,
    updateMethod,
    deleteMethod,
    setDefault,
    refresh
  };
}

// -----------------------------
// Notifications Hook
// -----------------------------
export function useNotifications() {
  const [notifications, setNotifications] = useState<BidderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<BidderNotification>['pagination'] | null>(null);
  const [filters, setFilters] = useState<NotificationsFilters>({});
  const [sort, setSort] = useState<SortConfig<NotificationsSortField>>({
    field: 'createdAt',
    direction: 'desc'
  });

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(sort).map(([key, value]) => [key, value])
        ),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, value])
        )
      });

      const response = await fetch(`/api/bidder/notifications?${params}`);
      const result: ApiResponse<any> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar notificações');
      }

      setNotifications(result.data.data);
      setUnreadCount(result.data.unreadCount);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (ids: string[]): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch('/api/bidder/notifications/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids })
      });

      const result = await response.json();

      if (result.success) {
        await fetchNotifications(); // Refresh list
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async (): Promise<ApiResponse<void>> => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    return markAsRead(unreadIds);
  }, [notifications, markAsRead]);

  const deleteNotification = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    // TODO: Implementar API de exclusão
    try {
      // Simular exclusão
      setNotifications(prev => prev.filter(n => n.id !== id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (pagination?.hasNext) {
      await fetchNotifications(pagination.page + 1);
    }
  }, [pagination, fetchNotifications]);

  const refresh = useCallback(() => {
    return fetchNotifications(1);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    filters,
    sort,
    setFilters,
    setSort,
    markAsRead,
    markAllAsRead,
    delete: deleteNotification,
    loadMore,
    refresh
  };
}

// -----------------------------
// Participation History Hook
// -----------------------------
export function useParticipationHistory() {
  const [participations, setParticipations] = useState<ParticipationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<ParticipationHistory>['pagination'] | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [filters, setFilters] = useState<ParticipationHistoryFilters>({});
  const [sort, setSort] = useState<SortConfig<ParticipationHistorySortField>>({
    field: 'participatedAt',
    direction: 'desc'
  });

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(sort).map(([key, value]) => [key, value])
        ),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, value])
        )
      });

      const response = await fetch(`/api/bidder/participation-history?${params}`);
      const result: ApiResponse<any> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar histórico');
      }

      setParticipations(result.data.data);
      setSummary(result.data.summary);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const loadMore = useCallback(async () => {
    if (pagination?.hasNext) {
      await fetchHistory(pagination.page + 1);
    }
  }, [pagination, fetchHistory]);

  const refresh = useCallback(() => {
    return fetchHistory(1);
  }, [fetchHistory]);

  return {
    participations,
    loading,
    error,
    pagination,
    summary,
    filters,
    sort,
    setFilters,
    setSort,
    loadMore,
    refresh
  };
}

// -----------------------------
// Bidder Profile Hook
// -----------------------------
export function useBidderProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bidder/profile');
      const result: ApiResponse<any> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar perfil');
      }

      setProfile(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/bidder/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        await fetchProfile(); // Refresh profile
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [fetchProfile]);

  const refresh = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refresh
  };
}
