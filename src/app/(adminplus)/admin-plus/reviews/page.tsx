/**
 * PÃ¡gina de listagem de Reviews (AvaliaÃ§Ãµes).
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';

import { getReviewColumns } from './columns';
import { listReviews, createReview, updateReview, deleteReview } from './actions';
import { ReviewForm } from './form';
import type { ReviewRow } from './types';

export default function ReviewsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);

  const table = useDataTable<ReviewRow>({ fetchAction: listReviews, defaultSort: { field: 'createdAt', order: 'desc' } });

  const handleEdit = useCallback((row: ReviewRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: ReviewRow) => { setDeleteTarget(row); }, []);
  const handleConfirmDelete = useCallback(async () => { if (!deleteTarget) return; const res = await deleteReview({ id: deleteTarget.id }); if (res.success) { toast.success('AvaliaÃ§Ã£o excluÃ­da'); table.refresh(); } else toast.error(res.error || 'Erro'); setDeleteTarget(null); }, [deleteTarget, table]);
  const handleSubmit = useCallback(async (data: any) => { const res = editing ? await updateReview({ ...data, id: editing.id }) : await createReview(data); if (res.success) { toast.success(editing ? 'Atualizado' : 'Criado'); setFormOpen(false); setEditing(null); table.refresh(); } else toast.error(res.error || 'Erro'); }, [editing, table]);

  const columns = useMemo(() => getReviewColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="reviews-page">
      <PageHeader title="AvaliaÃ§Ãµes" description="Gerencie avaliaÃ§Ãµes de lotes e leilÃµes" icon={Star} onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={table.data} isLoading={table.isLoading} pagination={table.pagination} onPaginationChange={table.onPaginationChange} sorting={table.sorting} onSortingChange={table.onSortingChange} search={table.search} onSearchChange={table.onSearchChange} onRowDoubleClick={handleEdit} />
      <ReviewForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />
      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={handleConfirmDelete} title="Excluir AvaliaÃ§Ã£o" description={`Excluir avaliaÃ§Ã£o de "${deleteTarget?.userDisplayName}"?`} />
    </div>
  );
}
