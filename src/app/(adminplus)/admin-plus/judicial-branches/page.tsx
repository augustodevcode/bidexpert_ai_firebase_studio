/**
 * @fileoverview Página de listagem de Varas Judiciais — Admin Plus.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import type { JudicialBranchRow } from './types';
import { getJudicialBranchColumns } from './columns';
import {
  listJudicialBranches,
  createJudicialBranch,
  updateJudicialBranch,
  deleteJudicialBranch,
} from './actions';
import { JudicialBranchForm } from './form';
import type { JudicialBranchSchema } from './schema';

export default function JudicialBranchesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JudicialBranchRow | null>(null);
  const [deleting, setDeleting] = useState<JudicialBranchRow | null>(null);

  const { data, isLoading, refresh } = useDataTable<JudicialBranchRow>({
    fetchFn: listJudicialBranches,
    defaultSort: { id: 'name', desc: false },
  });

  const handleEdit = useCallback((row: JudicialBranchRow) => {
    setEditing(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: JudicialBranchRow) => {
    setDeleting(row);
  }, []);

  const handleSubmit = useCallback(async (values: JudicialBranchSchema) => {
    const res = editing
      ? await updateJudicialBranch({ id: editing.id, ...values })
      : await createJudicialBranch(values);
    if (res?.success) {
      toast.success(editing ? 'Vara atualizada' : 'Vara criada');
      setFormOpen(false);
      setEditing(null);
      refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar vara');
    }
  }, [editing, refresh]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    const res = await deleteJudicialBranch({ id: deleting.id });
    if (res?.success) {
      toast.success('Vara excluída');
      setDeleting(null);
      refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir vara');
    }
  }, [deleting, refresh]);

  const columns = useMemo(
    () => getJudicialBranchColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  return (
    <div className="space-y-6 p-6" data-ai-id="judicial-branches-page">
      <PageHeader
        title="Varas Judiciais"
        description="Gerencie as varas judiciais do sistema."
        icon={Scale}
        primaryAction={{
          label: 'Nova Vara',
          onClick: () => { setEditing(null); setFormOpen(true); },
        }}
      />

      <DataTablePlus<JudicialBranchRow>
        data={data}
        isLoading={isLoading}
        columns={columns}
        searchPlaceholder="Buscar vara..."
        onRowDoubleClick={handleEdit}
        data-ai-id="judicial-branches-table"
      />

      <JudicialBranchForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        onSubmit={handleSubmit}
        defaultValues={editing}
      />

      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Excluir Vara"
        description={`Deseja excluir "${deleting?.name}"?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
