/**
 * @fileoverview Página CRUD de Processos Judiciais — Admin Plus.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { listJudicialProcesses, createJudicialProcess, updateJudicialProcess, deleteJudicialProcess } from './actions';
import { getJudicialProcessColumns } from './columns';
import type { JudicialProcessRow } from './types';
import type { JudicialProcessSchema } from './schema';
import { JudicialProcessForm } from './form';

export default function JudicialProcessesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JudicialProcessRow | null>(null);
  const [deleting, setDeleting] = useState<JudicialProcessRow | null>(null);

  const { data, isLoading, refresh } = useDataTable<JudicialProcessRow>({
    fetchFn: listJudicialProcesses,
    defaultSort: { id: 'processNumber', desc: false },
  });

  const handleEdit = useCallback((row: JudicialProcessRow) => {
    setEditing(row);
    setFormOpen(true);
  }, []);
  const handleDelete = useCallback((row: JudicialProcessRow) => setDeleting(row), []);

  const columns = useMemo(
    () => getJudicialProcessColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const handleSubmit = async (values: JudicialProcessSchema) => {
    const res = editing
      ? await updateJudicialProcess({ id: editing.id, data: values })
      : await createJudicialProcess(values);
    if (res?.success) {
      toast.success(editing ? 'Processo atualizado.' : 'Processo criado.');
      setFormOpen(false);
      setEditing(null);
      refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar processo.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    const res = await deleteJudicialProcess(deleting.id);
    if (res?.success) {
      toast.success('Processo excluído.');
      setDeleting(null);
      refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-6" data-ai-id="judicial-processes-page">
      <PageHeader
        title="Processos Judiciais"
        description="Gerencie os processos judiciais vinculados aos leilões."
        icon={Gavel}
      >
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} data-ai-id="judicial-process-btn-new">
          Novo Processo
        </Button>
      </PageHeader>

      <DataTablePlus
        data={data}
        isLoading={isLoading}
        columns={columns}
        searchPlaceholder="Pesquisar processo..."
        onRowDoubleClick={handleEdit}
        data-ai-id="judicial-processes-table"
      />

      <JudicialProcessForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        onSubmit={handleSubmit}
        defaultValues={editing}
      />

      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Excluir processo"
        description={`Deseja excluir o processo "${deleting?.processNumber ?? ''}"?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
