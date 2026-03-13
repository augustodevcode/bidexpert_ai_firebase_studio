/**
 * @fileoverview Página de Report no Admin Plus.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { BarChart3, Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { createReportAction, deleteReportAction, listReportsAction, updateReportAction } from './actions';
import { getReportColumns } from './columns';
import { ReportForm } from './form';
import type { ReportFormData } from './schema';
import type { ReportRow } from './types';

export default function ReportsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReportRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReportRow | null>(null);

  const { data, isLoading, refresh } = useDataTable<ReportRow>({
    fetchFn: listReportsAction,
    defaultSort: { field: 'updatedAt', direction: 'desc' },
  });

  const handleSubmit = useCallback(async (values: ReportFormData) => {
    const result = editing
      ? await updateReportAction({ id: editing.id, data: values })
      : await createReportAction(values);

    if (result.success) {
      toast.success(editing ? 'Relatório atualizado com sucesso' : 'Relatório criado com sucesso');
      setFormOpen(false);
      setEditing(null);
      refresh();
      return;
    }

    toast.error(result.error ?? 'Erro ao salvar relatório');
  }, [editing, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    const result = await deleteReportAction({ id: deleteTarget.id });
    if (result.success) {
      toast.success('Relatório excluído com sucesso');
      setDeleteTarget(null);
      refresh();
      return;
    }

    toast.error(result.error ?? 'Erro ao excluir relatório');
  }, [deleteTarget, refresh]);

  const columns = useMemo(() => getReportColumns({ onEdit: (row) => { setEditing(row); setFormOpen(true); }, onDelete: setDeleteTarget }), []);

  return (
    <div className="space-y-6" data-ai-id="reports-page">
      <PageHeader
        title="Relatórios"
        description="Gerencie definições salvas de relatórios e painéis reutilizáveis da operação."
        icon={BarChart3}
        data-ai-id="reports-page-header"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} data-ai-id="reports-refresh-button">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} data-ai-id="reports-create-button">
            <Plus className="mr-2 h-4 w-4" />
            Novo relatório
          </Button>
        </div>
      </PageHeader>

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nome ou descrição do relatório"
        data-ai-id="reports-data-table"
      />

      <ReportForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
        onSubmit={handleSubmit}
        defaultValues={editing}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={confirmDelete}
        title="Excluir relatório"
        description={`Tem certeza que deseja excluir o relatório "${deleteTarget?.name ?? ''}"?`}
        data-ai-id="reports-delete-confirmation-dialog"
      />
    </div>
  );
}