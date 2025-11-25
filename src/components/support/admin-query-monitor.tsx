'use client';

import React, { useState, useEffect } from 'react';
import { Database, Activity, Clock, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QueryLog {
  id: string;
  query: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  endpoint?: string;
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

  useEffect(() => {
    // Fetch query logs periodically
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/admin/query-monitor');
        if (response.ok) {
          const data = await response.json();
          setQueries(data.queries || []);
          setStats(data.stats || stats);
        }
      } catch (error) {
        console.error('Erro ao buscar logs:', error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const formatQuery = (query: string) => {
    if (query.length > 80) {
      return query.substring(0, 80) + '...';
    }
    return query;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white shadow-lg">
      {/* Header - Always Visible */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold">Query Monitor</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-400" />
              <span>Total: {stats.total}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-400" />
              <span>Média: {formatDuration(stats.avgDuration)}</span>
            </div>

            {stats.slowQueries > 0 && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500">
                Lentas: {stats.slowQueries}
              </Badge>
            )}

            {stats.failedQueries > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500">
                Falhas: {stats.failedQueries}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:bg-slate-800"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Minimizar
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Expandir
            </>
          )}
        </Button>
      </div>

      {/* Expanded Content */}
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isExpanded ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="p-4 overflow-y-auto max-h-80">
          <div className="space-y-2">
            {queries.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma query registrada</p>
              </div>
            ) : (
              queries.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    log.success
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-red-900/20 border-red-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.success ? (
                          <div className="h-2 w-2 rounded-full bg-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <code className="text-xs font-mono text-gray-300 truncate">
                          {formatQuery(log.query)}
                        </code>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {log.endpoint && (
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                            {log.endpoint}
                          </span>
                        )}
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          log.duration > 1000
                            ? 'bg-red-500/10 text-red-400 border-red-500'
                            : log.duration > 500
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500'
                            : 'bg-green-500/10 text-green-400 border-green-500'
                        )}
                      >
                        {formatDuration(log.duration)}
                      </Badge>
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
