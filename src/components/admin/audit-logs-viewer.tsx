'use client';

import React, { useState, useEffect } from 'react';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  model: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  recordId: string;
  changes?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogsViewerProps {
  tenantId: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit Logs Viewer Component
 * Componente para visualizar e filtrar audit logs da plataforma
 * Todos os elementos têm className contextualizados para fácil identificação nos testes
 */
export function AuditLogsViewer({ tenantId, limit = 50, offset = 0 }: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  // Carregar audit logs ao montar
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          ...(filterModel && { model: filterModel }),
          ...(filterAction && { action: filterAction }),
        });

        const response = await fetch(`/api/admin/audit-logs?${params}`);
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        const json = await response.json();
        setLogs(json.data.logs);
        setStats(json.data.stats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filterModel, filterAction, limit, offset]);

  const handleCleanup = async () => {
    if (!confirm('Deseja deletar logs com mais de 30 dias?')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/audit-logs?olderThanDays=30', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to cleanup logs');
      const json = await response.json();
      // Reload logs
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'READ':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="audit-logs-viewer-loading" data-testid="audit-logs-loading">
        <p className="text-gray-500">Carregando logs de auditoria...</p>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="audit-logs-viewer-error" data-testid="audit-logs-error">
        <p className="text-red-600">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div
      className="audit-logs-viewer-container space-y-4 p-6 bg-white rounded-lg shadow"
      data-testid="audit-logs-container"
    >
      <div className="audit-logs-viewer-header flex justify-between items-center">
        <h2 className="audit-logs-viewer-title text-2xl font-bold">Logs de Auditoria</h2>
        <button
          className="audit-logs-viewer-cleanup-btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
          onClick={handleCleanup}
          disabled={loading}
          data-testid="audit-logs-cleanup-button"
        >
          Limpar Logs Antigos
        </button>
      </div>

      {/* Filters */}
      <div className="audit-logs-viewer-filters space-y-3 p-4 bg-gray-50 rounded">
        <h3 className="audit-logs-viewer-filters-title font-semibold">Filtros</h3>
        <div className="audit-logs-viewer-filters-content grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="audit-logs-viewer-filter-model">
            <label className="audit-logs-viewer-filter-model-label block text-sm font-medium mb-1">
              Modelo:
              <select
                className="audit-logs-viewer-filter-model-select w-full mt-1 px-3 py-2 border rounded"
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                data-testid="audit-logs-filter-model"
              >
                <option value="">Todos</option>
                <option value="Auction">Auction</option>
                <option value="Bid">Bid</option>
                <option value="User">User</option>
                <option value="AuditLog">AuditLog</option>
              </select>
            </label>
          </div>
          <div className="audit-logs-viewer-filter-action">
            <label className="audit-logs-viewer-filter-action-label block text-sm font-medium mb-1">
              Ação:
              <select
                className="audit-logs-viewer-filter-action-select w-full mt-1 px-3 py-2 border rounded"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                data-testid="audit-logs-filter-action"
              >
                <option value="">Todas</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="READ">READ</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="audit-logs-viewer-stats p-4 bg-blue-50 rounded">
          <h3 className="audit-logs-viewer-stats-title font-semibold mb-2">
            Resumo dos Últimos 7 Dias
          </h3>
          <div className="audit-logs-viewer-stats-list grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {stats.map((stat: any, idx: number) => (
              <div
                key={idx}
                className="audit-logs-viewer-stats-item"
                data-testid={`audit-logs-stat-${stat.model}-${stat.action}`}
              >
                <span className="font-medium">{stat.model}:</span>
                <span className="ml-1">{stat._count} {stat.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="audit-logs-viewer-table overflow-x-auto">
        <table className="audit-logs-viewer-table-element w-full text-sm border-collapse">
          <thead className="audit-logs-viewer-table-header bg-gray-100">
            <tr className="audit-logs-viewer-table-header-row">
              <th className="audit-logs-viewer-table-header-timestamp border px-4 py-2 text-left">
                Data/Hora
              </th>
              <th className="audit-logs-viewer-table-header-model border px-4 py-2 text-left">
                Modelo
              </th>
              <th className="audit-logs-viewer-table-header-action border px-4 py-2 text-left">
                Ação
              </th>
              <th className="audit-logs-viewer-table-header-userid border px-4 py-2 text-left">
                Usuário
              </th>
              <th className="audit-logs-viewer-table-header-recordid border px-4 py-2 text-left">
                ID do Registro
              </th>
            </tr>
          </thead>
          <tbody className="audit-logs-viewer-table-body">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="audit-logs-viewer-table-row hover:bg-gray-50 border-b"
                data-testid={`audit-log-row-${log.id}`}
              >
                <td className="audit-logs-viewer-table-cell-timestamp border px-4 py-2 text-xs">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </td>
                <td className="audit-logs-viewer-table-cell-model border px-4 py-2">
                  <span className="audit-logs-viewer-table-cell-model-text font-medium">
                    {log.model}
                  </span>
                </td>
                <td className="audit-logs-viewer-table-cell-action border px-4 py-2">
                  <span
                    className={`audit-logs-viewer-table-cell-action-badge px-2 py-1 rounded text-xs font-semibold ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="audit-logs-viewer-table-cell-userid border px-4 py-2 text-xs">
                  {log.userId}
                </td>
                <td className="audit-logs-viewer-table-cell-recordid border px-4 py-2 text-xs font-mono">
                  {log.recordId.substring(0, 12)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="audit-logs-viewer-table-empty text-center py-4 text-gray-500">
            Nenhum log encontrado com os filtros selecionados
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="audit-logs-viewer-footer text-center text-sm text-gray-600">
          Mostrando {logs.length} logs de {limit} (offset: {offset})
        </div>
      )}
    </div>
  );
}
