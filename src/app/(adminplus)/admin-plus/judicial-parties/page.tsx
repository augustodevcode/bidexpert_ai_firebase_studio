/**
 * Página de listagem de Partes Processuais (JudicialParty).
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';

import { getJudicialPartyColumns } from './columns';
import { listJudicialParties, createJudicialParty, updateJudicialParty, deleteJudicialParty } from './actions';
import { JudicialPartyForm } from './form';
import type { JudicialPartyRow } from './types';

export default function JudicialPartiesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JudicialPartyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JudicialPartyRow | null>(null);

  const table = useDataTable<JudicialPartyRow>({ fetchAction: listJudicialParties, defaultSort: { field: 'name', order: 'asc' } });

  const handleEdit = useCallback((row: JudicialPartyRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: JudicialPartyRow) => { setDeleteTarget(row); }, []);
  const handleConfirmDelete = useCallback(async () => { if (!deleteTarget) return; const res = await deleteJudicialParty({ id: deleteTarget.id }); if (res.success) { toast.success('Parte excluída'); table.refresh(); } else toast.error(res.error || 'Erro'); setDeleteTarget(null); }, [deleteTarget, table]);
  const handleSubmit = useCallback(async (data: any) => { const res = editing ? await updateJudicialParty({ ...data, id: editing.id }) : await createJudicialParty(data); if (res.success) { toast.success(editing ? 'Atualizado' : 'Criado'); setFormOpen(false); setEditing(null); table.refresh(); } else toast.error(res.error || 'Erro'); }, [editing, table]);

  const columns = useMemo(() => getJudicialPartyColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="judicial-parties-page">
      <PageHeader title="Partes Processuais" description="Gerencie as partes dos processos judiciais" icon={Users} onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={table.data} isLoading={table.isLoading} pagination={table.pagination} onPaginationChange={table.onPaginationChange} sorting={table.sorting} onSortingChange={table.onSortingChange} search={table.search} onSearchChange={table.onSearchChange} onRowDoubleClick={handleEdit} />
      <JudicialPartyForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={handleConfirmDelete} title="Excluir Parte" description={`Excluir "${deleteTarget?.name}"?`} />
    </div>
  );
}
