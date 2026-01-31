/**
 * @fileoverview Monitor de queries do admin com bloco de Dev Info integrado.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Database, Activity, Clock, AlertCircle, ChevronUp, ChevronDown, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';

interface QueryLog {
  id: string;
  query: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  endpoint?: string;
  userId?: string | null;
}

export default function AdminQueryMonitor() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [queries, setQueries] = useState<QueryLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgDuration: 0,
    slowQueries: 0,
    failedQueries: 0,
  });

  // Expose current height so other UI (DevInfoIndicator) can position itself above the monitor.
  // Collapsed: h-12 => 48px, Expanded: h-96 => 384px
  useEffect(() => {
    const collapsed = '48px';
    const expanded = '384px';
    const height = isExpanded ? expanded : collapsed;
    try {
      document.documentElement.style.setProperty('--admin-query-monitor-height', height);
    } catch (e) {
      // ignore in test envs where document might not exist
    }

    return () => {
      try {
        // reset to collapsed when unmounting
        document.documentElement.style.setProperty('--admin-query-monitor-height', collapsed);
      } catch (e) {}
    };
  }, [isExpanded]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/query-monitor');
      
      if (response.status === 401) {
          setError('Não autorizado. Faça login como admin.');
          // Don't clear queries to persist old state if transient
          return;
      }

      if (response.ok) {
        const data = await response.json();
        setQueries(data.queries || []);
        setStats(data.stats || {
          total: 0,
          avgDuration: 0,
          slowQueries: 0,
          failedQueries: 0,
        });
      } else {
        setError('Erro ao buscar logs: ' + response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      setError('Erro de conexão ao buscar logs');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os logs de query?')) return;
    
    try {
      const response = await fetch('/api/admin/query-monitor', { method: 'DELETE' });
      if (response.ok) {
        toast.success('Logs limpos com sucesso');
        fetchLogs();
      } else {
        toast.error('Erro ao limpar logs');
      }
    } catch (error) {
      toast.error('Erro ao limpar logs');
    }
  };

  const formatQuery = (query: string) => {
    if (!query) return '';
    if (query.length > 120) {
      return query.substring(0, 120) + '...';
    }
    return query;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] text-slate-100 font-sans">
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between px-4 py-2 h-12">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold tracking-wide">Query Monitor</span>
            {error && <Badge variant="destructive" className="ml-2 text-[10px] h-5">{error}</Badge>}
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Total: <span className="text-slate-200 font-medium">{stats.total}</span></span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Média: <span className="text-slate-200 font-medium">{formatDuration(stats.avgDuration)}</span></span>
            </div>

            {stats.slowQueries > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/50 hover:bg-amber-500/20">
                Lentas: {stats.slowQueries}
              </Badge>
            )}

            {stats.failedQueries > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/50 hover:bg-red-500/20">
                Falhas: {stats.failedQueries}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
             <Button
                variant="ghost"
                size="icon"
                onClick={fetchLogs}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                title="Atualizar agora"
            >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            
            {isExpanded && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearLogs}
                    className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    title="Limpar logs"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}

            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 text-slate-300 hover:text-white hover:bg-slate-800 gap-1 pl-2 pr-2"
            >
                {isExpanded ? (
                <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Minimizar</span>
                </>
                ) : (
                <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Expandir</span>
                </>
                )}
            </Button>
        </div>
      </div>

      {/* Expanded Content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out border-t border-slate-800 bg-slate-950',
          isExpanded ? 'h-96 opacity-100' : 'h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="space-y-4" data-ai-id="query-monitor-content">
            <div data-ai-id="query-monitor-dev-info">
              <DevInfoIndicator />
            </div>
            {queries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                <Database className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">Nenhuma query registrada recentemente</p>
                <p className="text-xs opacity-60 mt-1">As queries aparecerão aqui em tempo real</p>
              </div>
            ) : (
              queries.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'group relative p-3 rounded-lg border text-sm transition-colors hover:shadow-md',
                    log.success
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      : 'bg-red-900/10 border-red-900/30 hover:border-red-900/50'
                  )}
                >
                  <div className="flex flex-col gap-2">
                     <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                             {log.success ? (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                ) : (
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                            <code className="font-mono text-xs text-slate-300 truncate w-full select-all" title={log.query}>
                                {log.query}
                            </code>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                            'text-[10px] h-5 px-1.5 font-mono flex-shrink-0',
                            log.duration > 1000
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : log.duration > 500
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            )}
                        >
                            {formatDuration(log.duration)}
                        </Badge>
                     </div>

                     <div className="flex items-center justify-between text-xs text-slate-500 pl-4">
                        <div className="flex items-center gap-3">
                             <span className="font-mono opacity-70">{new Date(log.timestamp).toLocaleTimeString()}</span>
                             {log.endpoint && (
                                <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-blue-500/5 text-blue-400/80 border border-blue-500/10">
                                    <span className="w-1 h-1 rounded-full bg-blue-400/50"></span>
                                    {log.endpoint}
                                </span>
                             )}
                             {log.userId && (
                                <span className="text-slate-600">User: {log.userId}</span>
                             )}
                        </div>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
