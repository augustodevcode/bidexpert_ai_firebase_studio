/**
 * @fileoverview Indicador de status de conexão do monitor.
 * Exibe WebSocket, Polling ou Desconectado com ícone animado.
 */
'use client';

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface MonitorConnectionStatusProps {
  connectionType: 'websocket' | 'polling' | 'disconnected';
  isConnected: boolean;
}

export default function MonitorConnectionStatus({ connectionType, isConnected }: MonitorConnectionStatusProps) {
  const config = {
    websocket: {
      icon: <Wifi className="h-3.5 w-3.5 text-emerald-400" />,
      label: 'WebSocket',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
    },
    polling: {
      icon: <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />,
      label: 'Polling',
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
    },
    disconnected: {
      icon: <WifiOff className="h-3.5 w-3.5 text-red-400 animate-pulse" />,
      label: 'Reconectando...',
      bg: 'bg-red-500/20',
      text: 'text-red-300',
    },
  };

  const c = isConnected ? config[connectionType] : config.disconnected;

  return (
    <div
      data-ai-id="monitor-connection-status"
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${c.bg}`}
    >
      {c.icon}
      <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
    </div>
  );
}
