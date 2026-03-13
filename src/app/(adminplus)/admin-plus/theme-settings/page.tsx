/**
 * @fileoverview Página de listagem de ThemeSettings — Admin Plus.
 * CRUD completo com DataTablePlus, dialog form, confirmação de exclusão.
 */
'use client';

import { useState, useCallback } from 'react';
import { Palette, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';

import { columns } from './columns';
import { ThemeSettingsForm } from './form';
import { listThemeSettingsAction, deleteThemeSettingsAction } from './actions';
import type { ThemeSettingsRow } from './types';

export default function ThemeSettingsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<ThemeSettingsRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<ThemeSettingsRow | null>(null);

  const fetchData = useCallback(async (params: { page: number; pageSize: number; search: string; sortField: string; sortOrder: 'asc' | 'desc' }) => {
    const res = await listThemeSettingsAction(params);
    if (res?.success && res.data) return res.data as { data: ThemeSettingsRow[]; total: number; page: number; pageSize: number; totalPages: number };
    return { data: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 0 };
  }, []);

  const table = useDataTable<ThemeSettingsRow>({ fetchData, defaultSort: { field: 'name', order: 'asc' } });

  const handleEdit = (row: ThemeSettingsRow) => { setEditRow(row); setFormOpen(true); };
  const handleNew = () => { setEditRow(null); setFormOpen(true); };
  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      const res = await deleteThemeSettingsAction({ id: deleteRow.id });
      if (res?.success) { toast.success('Tema excluído.'); table.refresh(); }
      else toast.error(res?.error ?? 'Erro ao excluir.');
    } catch { toast.error('Erro inesperado.'); }
    setDeleteRow(null);
  };

  return (
    <div data-ai-id="theme-settings-page">
      <PageHeader title="Temas de Cores" icon={Palette}>
        <Button onClick={handleNew} data-ai-id="theme-settings-add">
          <Plus className="mr-2 h-4 w-4" /> Novo Tema
        </Button>
      </PageHeader>

      <DataTablePlus
        columns={columns}
        data={table.data}
        totalRows={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onSearchChange={table.setSearch}
        onSortChange={table.setSort}
        isLoading={table.loading}
        onRowClick={handleEdit}
        actions={(row) => [
          { label: 'Editar', onClick: () => handleEdit(row) },
          { label: 'Excluir', onClick: () => setDeleteRow(row), variant: 'destructive' as const },
        ]}
      />

      <ThemeSettingsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editRow={editRow}
        onSuccess={table.refresh}
      />

      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={() => setDeleteRow(null)}
        title="Excluir Tema"
        description={`Deseja realmente excluir o tema "${deleteRow?.name}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
