/**
 * Page component for LotQuestion CRUD management.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getLotQuestionColumns } from './columns';
import { listLotQuestions, deleteLotQuestion } from './actions';
import { LotQuestionForm } from './form';
import type { LotQuestionRow } from './types';

export default function LotQuestionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LotQuestionRow | null>(null);
  const [deleting, setDeleting] = useState<LotQuestionRow | null>(null);

  const { data, isLoading, pagination, sorting, searchQuery, setSearchQuery, setPagination, setSorting, refresh } = useDataTable<LotQuestionRow>({ fetchFn: listLotQuestions, defaultSort: { field: 'createdAt', order: 'desc' } });

  const handleEdit = useCallback((row: LotQuestionRow) => { setEditing(row); setFormOpen(true); }, []);
  const handleDelete = useCallback((row: LotQuestionRow) => setDeleting(row), []);
  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    const res = await deleteLotQuestion({ id: deleting.id });
    if (res.success) { toast.success('Pergunta excluída'); refresh(); } else toast.error(res.error ?? 'Erro ao excluir');
    setDeleting(null);
  }, [deleting, refresh]);

  const columns = useMemo(() => getLotQuestionColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="lot-questions-page">
      <PageHeader title="Perguntas de Lotes" description="Gerencie perguntas e respostas sobre os lotes" icon={HelpCircle} onCreate={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={columns} data={data?.data ?? []} totalRows={data?.total ?? 0} isLoading={isLoading} pagination={pagination} onPaginationChange={setPagination} sorting={sorting} onSortingChange={setSorting} searchQuery={searchQuery} onSearchChange={setSearchQuery} onRowDoubleClick={handleEdit} />
      <LotQuestionForm open={formOpen} onOpenChange={setFormOpen} editingRow={editing} onSuccess={refresh} />
      <ConfirmationDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={handleConfirmDelete} title="Excluir Pergunta" description={`Deseja excluir a pergunta de "${deleting?.userDisplayName}"?`} />
    </div>
  );
}
