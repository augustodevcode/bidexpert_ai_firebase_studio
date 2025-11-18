'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SoftCloseConfig } from '@/lib/bid-events';

export interface SoftCloseManagerProps {
  tenantId: string;
  auctionId?: string;
}

/**
 * Soft Close Manager Component
 * Componente para gerenciar configurações de Soft Close e eventos WebSocket
 * Todos os elementos têm className contextualizados para fácil identificação nos testes
 */
export function SoftCloseManager({ tenantId, auctionId }: SoftCloseManagerProps) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Carregar feature flags ao montar
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/feature-flags');
        if (!response.ok) throw new Error('Failed to fetch config');
        const json = await response.json();
        setConfig({
          softCloseEnabled: json.data.featureFlags.softCloseEnabled,
          softCloseMinutes: json.data.featureFlags.softCloseMinutes,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Conectar ao WebSocket se tiver auctionId
  useEffect(() => {
    if (!auctionId || !config?.softCloseEnabled) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws/auctions/${auctionId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          addEvent('✓ Conectado ao WebSocket');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          addEvent(`📦 ${data.type}: ${JSON.stringify(data.payload)}`);
        };

        ws.onerror = (error) => {
          addEvent(`❌ Erro: ${error}`);
        };

        ws.onclose = () => {
          setWsConnected(false);
          addEvent('✗ Desconectado do WebSocket');
        };

        wsRef.current = ws;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to WebSocket');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [auctionId, config?.softCloseEnabled]);

  const addEvent = (event: string) => {
    setEvents((prev) => [
      `[${new Date().toLocaleTimeString('pt-BR')}] ${event}`,
      ...prev,
    ].slice(0, 50)); // Manter apenas últimos 50
  };

  const handleToggleSoftClose = async (enabled: boolean) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ softCloseEnabled: enabled }),
      });
      if (!response.ok) throw new Error('Failed to save');
      setConfig({ ...config, softCloseEnabled: enabled });
      addEvent(`${enabled ? '✓' : '✗'} Soft Close ${enabled ? 'ativado' : 'desativado'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendAuction = async () => {
    if (!auctionId) {
      setError('Auction ID não fornecido');
      return;
    }

    try {
      const response = await fetch(`/api/auctions/${auctionId}/extend-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionMinutes: 5 }),
      });
      if (!response.ok) throw new Error('Failed to extend');
      const json = await response.json();
      addEvent(`⏱️ Leilão estendido por 5 minutos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend');
    }
  };

  if (loading) {
    return (
      <div className="softclose-manager-loading" data-testid="softclose-loading">
        <p className="text-gray-500">Carregando configuração de Soft Close...</p>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="softclose-manager-error" data-testid="softclose-error">
        <p className="text-red-600">Erro: {error}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="softclose-manager-empty" data-testid="softclose-empty">
        <p className="text-gray-500">Nenhuma configuração disponível</p>
      </div>
    );
  }

  return (
    <div
      className="softclose-manager-container space-y-6 p-6 bg-white rounded-lg shadow"
      data-testid="softclose-container"
    >
      <h2 className="softclose-manager-title text-2xl font-bold">Gerenciador de Soft Close</h2>

      {error && (
        <div className="softclose-manager-error-message bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Soft Close Toggle */}
      <div className="softclose-manager-toggle-section border-t pt-4">
        <h3 className="softclose-manager-toggle-title text-lg font-semibold mb-3">
          Status do Soft Close
        </h3>
        <div className="softclose-manager-toggle-controls flex items-center gap-4">
          <label className="softclose-manager-toggle-label flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="softclose-manager-toggle-checkbox w-5 h-5"
              checked={config.softCloseEnabled}
              onChange={(e) => handleToggleSoftClose(e.target.checked)}
              disabled={loading}
              data-testid="softclose-toggle-input"
            />
            <span className="softclose-manager-toggle-text">
              {config.softCloseEnabled ? 'Soft Close Ativado' : 'Soft Close Desativado'}
            </span>
          </label>
          <span className="softclose-manager-toggle-status text-sm font-medium">
            {config.softCloseEnabled ? (
              <span className="text-green-600">🟢 Ativo</span>
            ) : (
              <span className="text-red-600">🔴 Inativo</span>
            )}
          </span>
        </div>

        {config.softCloseEnabled && (
          <div className="softclose-manager-config mt-3 p-3 bg-blue-50 rounded">
            <p className="softclose-manager-config-minutes text-sm">
              <span className="font-medium">Janela de Soft Close:</span>
              <span className="ml-2 font-bold">{config.softCloseMinutes} minutos</span>
            </p>
            <p className="softclose-manager-config-info text-xs text-gray-600 mt-1">
              Quando um lance é feito nos últimos {config.softCloseMinutes} minutos,
              o leilão é automaticamente estendido.
            </p>
          </div>
        )}
      </div>

      {/* Auction Extension Controls */}
      {auctionId && config.softCloseEnabled && (
        <div className="softclose-manager-extension-section border-t pt-4">
          <h3 className="softclose-manager-extension-title text-lg font-semibold mb-3">
            Controles de Extensão
          </h3>
          <button
            className="softclose-manager-extension-button px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleExtendAuction}
            disabled={loading || !wsConnected}
            data-testid="softclose-extend-button"
          >
            Estender Leilão por 5 Minutos
          </button>
          {!wsConnected && (
            <p className="softclose-manager-extension-warning text-xs text-amber-600 mt-2">
              ⚠️ WebSocket desconectado. Conecte-se primeiro.
            </p>
          )}
        </div>
      )}

      {/* WebSocket Status */}
      {auctionId && (
        <div className="softclose-manager-websocket-section border-t pt-4">
          <h3 className="softclose-manager-websocket-title text-lg font-semibold mb-3">
            Status WebSocket
          </h3>
          <div className="softclose-manager-websocket-status">
            <span
              className={`softclose-manager-websocket-status-badge px-3 py-1 rounded text-sm font-semibold ${
                wsConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
              data-testid="softclose-websocket-status"
            >
              {wsConnected ? '✓ Conectado' : '✗ Desconectado'}
            </span>
          </div>
        </div>
      )}

      {/* Events Log */}
      {auctionId && events.length > 0 && (
        <div className="softclose-manager-events-section border-t pt-4">
          <h3 className="softclose-manager-events-title text-lg font-semibold mb-3">
            Log de Eventos
          </h3>
          <div className="softclose-manager-events-list bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-48 overflow-y-auto">
            {events.map((event, idx) => (
              <div
                key={idx}
                className="softclose-manager-events-item"
                data-testid={`softclose-event-${idx}`}
              >
                {event}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
