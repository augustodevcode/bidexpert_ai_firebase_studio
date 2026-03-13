/**
 * Página de listagem de UserWin (Arrematações).
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { toast } from 'sonner';
import { getUserWinColumns } from './columns';
import { listUserWins, deleteUserWin } from './actions';
import UserWinForm from './form';
import type { UserWinRow } from './types';

export default function UserWinsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserWinRow | null>(null);
  const [deleting, setDeleting] = useState<UserWinRow | null>(null);

  const { data, isLoading, pagination, sorting, setSorting, setSearch, refresh } = useDataTable<UserWinRow>({ fetchFn: listUserWins, defaultSort: { id: 'winDate', desc: true } });

  const handleEdit = useCallback((r: UserWinRow) => { setEditing(r); setFormOpen(true); }, []);
  const handleDelete = useCallback((r: UserWinRow) => setDeleting(r), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    const res = await deleteUserWin({ id: deleting.id });
    if (res?.success) { toast.success('Excluído!'); refresh(); } else toast.error(res?.error ?? 'Erro');
    setDeleting(null);
  }, [deleting, refresh]);

  const columns = useMemo(() => getUserWinColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="user-wins-page">
      <PageHeader title="Arrematações" icon={Trophy} onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={data?.data ?? []} isLoading={isLoading} pagination={pagination} sorting={sorting} onSortingChange={setSorting} onSearchChange={setSearch} onRowDoubleClick={handleEdit} />
      <UserWinForm open={formOpen} onOpenChange={setFormOpen} editingItem={editing} onSuccess={refresh} />
      <ConfirmationDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)} onConfirm={handleConfirmDelete} title="Excluir Arrematação" description={`Excluir arrematação #${deleting?.id}?`} />
    </div>
  );
}
