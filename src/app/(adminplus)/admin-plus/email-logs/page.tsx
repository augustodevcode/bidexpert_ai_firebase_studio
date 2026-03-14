/**
 * @fileoverview Página de EmailLog no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MailCheck, RefreshCcw, SendHorizonal, CircleX, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getEmailLogColumns } from './columns';
import { EmailLogDetailsSheet } from './details-sheet';
import { getEmailLogStatsAction, listEmailLogsAction } from './actions';
import type { EmailLogRow, EmailLogStats } from './types';

export default function EmailLogsPage() {
  const [selectedLog, setSelectedLog] = useState<EmailLogRow | null>(null);
  const [stats, setStats] = useState<EmailLogStats | null>(null);

  const fetchStats = useCallback(async () => {
    const result = await getEmailLogStatsAction({});
    if (result.success && result.data) {
      setStats(result.data);
    } else {
      toast.error(result.error ?? 'Erro ao carregar estatísticas de e-mail');
    }
  }, []);

  const { data, isLoading, refresh } = useDataTable<EmailLogRow>({
    fetchFn: listEmailLogsAction,
    defaultSort: { field: 'createdAt', direction: 'desc' },
  });

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleRefresh = useCallback(() => {
    refresh();
    void fetchStats();
  }, [fetchStats, refresh]);

  const columns = useMemo(() => getEmailLogColumns({ onView: setSelectedLog }), []);

  return (
    <div className="space-y-6" data-ai-id="email-logs-page">
      <PageHeader
        title="Logs de E-mail"
        description="Acompanhe entregas, falhas e conteúdo enviado pelos provedores de e-mail."
        icon={MailCheck}
        data-ai-id="email-logs-page-header"
      >
        <Button variant="outline" onClick={handleRefresh} data-ai-id="email-logs-refresh-button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </PageHeader>

      {stats ? (
        <div className="grid gap-4 md:grid-cols-4" data-ai-id="email-logs-stats-grid">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium"><MailCheck className="h-4 w-4" />Total</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium"><SendHorizonal className="h-4 w-4" />Enviados</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.sent}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium"><CircleX className="h-4 w-4" />Falhas</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.failed}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4" />Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.pending}</CardContent>
          </Card>
        </div>
      ) : null}

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="Buscar por destinatário, assunto, provedor ou erro"
        data-ai-id="email-logs-data-table"
      />

      <EmailLogDetailsSheet
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null);
          }
        }}
        log={selectedLog}
      />
    </div>
  );
}