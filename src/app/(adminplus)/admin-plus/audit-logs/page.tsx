/**
 * PÃ¡gina de listagem de Logs de Auditoria (AuditLog) no Admin Plus.
 */
'use client';

import { useState, useCallback } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';

import { getAuditLogColumns } from './columns';
import { AuditLogForm } from './form';
import { listAuditLogs, createAuditLog, updateAuditLog, deleteAuditLog } from './actions';
import type { AuditLogRow } from './types';
import type { AuditLogFormData } from './schema';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import type { BulkAction } from '@/components/admin-plus/data-table-plus';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function AuditLogsPage() {
  /* â”€â”€ state â”€â”€ */
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AuditLogRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuditLogRow | null>(null);

  /* â”€â”€ data fetching â”€â”€ */
  const fetchFn = useCallback(async (params: { page: number; pageSize: number; sort?: { field: string; direction: string }; search?: string }) => {
    const r = await listAuditLogs({ page: params.page, pageSize: params.pageSize, sortField: params.sort?.field, sortDirection: params.sort?.direction as any, search: params.search });
    if (r.success && r.data) return r.data as PaginatedResponse<AuditLogRow>;
    return { data: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 0 } as PaginatedResponse<AuditLogRow>;
  }, []);

  const { data, total, page, pageSize, totalPages, sorting, setSorting, search, setSearch, setPage, setPageSize, isLoading, refresh } = useDataTable<AuditLogRow>({ fetchFn, defaultSort: { field: 'timestamp', direction: 'desc' } });

  /* â”€â”€ handlers â”€â”€ */
  const handleEdit = (row: AuditLogRow) => { setEditing(row); setFormOpen(true); };
  const handleDelete = (row: AuditLogRow) => setDeleteTarget(row);

  const handleSubmit = async (formData: AuditLogFormData) => {
    const r = editing ? await updateAuditLog({ id: editing.id, data: formData }) : await createAuditLog(formData);
    if (r.success) { toast.success(editing ? 'Log atualizado' : 'Log criado'); setFormOpen(false); setEditing(null); refresh(); } else { toast.error(r.error || 'Erro'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const r = await deleteAuditLog({ id: deleteTarget.id });
    if (r.success) { toast.success('Log excluÃ­do'); setDeleteTarget(null); refresh(); } else { toast.error(r.error || 'Erro'); }
  };

  const columns = getAuditLogColumns({ onEdit: handleEdit, onDelete: handleDelete });

  const bulkActions: BulkAction<AuditLogRow>[] = [
    { label: 'Excluir selecionados', icon: Trash2, variant: 'destructive' as const, onExecute: async (rows) => { for (const row of rows) await deleteAuditLog({ id: row.id }); toast.success(`${rows.length} log(s) excluÃ­do(s)`); refresh(); } },
  ];

  return (
    <div className="space-y-6" data-ai-id="audit-logs-page">
      <PageHeader icon={ClipboardList} title="Logs de Auditoria" description="HistÃ³rico completo de aÃ§Ãµes realizadas no sistema.">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} data-ai-id="audit-log-new-btn"><Plus className="mr-2 h-4 w-4" /> Novo Log</Button>
      </PageHeader>

      <DataTablePlus columns={columns} data={data} total={total} page={page} pageSize={pageSize} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[...(PAGE_SIZE_OPTIONS as readonly number[])]} sorting={sorting} onSortingChange={setSorting} search={search} onSearchChange={setSearch} isLoading={isLoading} bulkActions={bulkActions} />

      <AuditLogForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} defaultValues={editing} />

      <ConfirmationDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} title="Excluir Log" description={`Excluir log #${deleteTarget?.id}?`} onConfirm={confirmDelete} />
    </div>
  );
}
