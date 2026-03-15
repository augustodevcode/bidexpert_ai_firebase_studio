/**
 * @fileoverview Página de listagem de Tenants no Admin Plus.
 * DataTable com busca, paginação client-side e exclusão em lote.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { PAGE_SIZE_OPTIONS } from '@/lib/admin-plus/constants';
import { getTenantColumns, type TenantRow } from './columns';
import { listTenantsAction, createTenantAction, updateTenantAction, deleteTenantAction } from './actions';
import { TenantForm } from './form';
import type { BulkAction, PaginatedResponse } from '@/lib/admin-plus/types';
import type { CreateTenantInput } from './schema';

export default function TenantsPage() {
  const [data, setData] = useState<PaginatedResponse<TenantRow>>({
    data: [], total: 0, page: 1, pageSize: PAGE_SIZE_OPTIONS[0], totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<TenantRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantRow | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await listTenantsAction(undefined as never);
    if (result.success && result.data) {
      setData(result.data as PaginatedResponse<TenantRow>);
    } else {
      toast.error(result.error ?? 'Erro ao carregar tenants');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEdit = useCallback((row: TenantRow) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (values: CreateTenantInput) => {
    const result = editRow
      ? await updateTenantAction({ id: editRow.id, data: values })
      : await createTenantAction(values);
    if (result.success) {
      toast.success(editRow ? 'Tenant atualizado' : 'Tenant criado');
      setFormOpen(false);
      setEditRow(null);
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
  }, [editRow, loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteTenantAction({ id: deleteTarget.id });
    if (result.success) {
      toast.success('Tenant excluído');
      loadData();
    } else {
      toast.error(result.error ?? 'Erro ao excluir');
    }
    setDeleteTarget(null);
  };

  const columns = useMemo(
    () =>
      getTenantColumns({
        onEdit: handleEdit,
        onDelete: (row) => setDeleteTarget(row),
      }),
    [handleEdit],
  );

  const bulkActions: BulkAction<TenantRow>[] = useMemo(
    () => [
      {
        label: 'Excluir selecionados',
        variant: 'destructive' as const,
        onExecute: async (rows) => {
          let errors = 0;
          for (const row of rows) {
            const result = await deleteTenantAction({ id: row.id });
            if (!result.success) errors++;
          }
          if (errors) toast.error(`${errors} falha(s) ao excluir`);
          else toast.success(`${rows.length} tenant(s) excluído(s)`);
          loadData();
        },
      },
    ],
    [loadData],
  );

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Gerencie os inquilinos (leiloeiros) do sistema."
        icon={Building2}
        primaryAction={{
          label: 'Novo Tenant',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
        data-ai-id="tenants-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={data.data}
        totalRows={data.total}
        isLoading={isLoading}
        searchPlaceholder="Buscar tenants..."
        searchColumn="name"
        bulkActions={bulkActions}
        pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
        onRowDoubleClick={handleEdit}
        data-ai-id="tenants-data-table"
      />

      <TenantForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir Tenant"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação é irreversível.`}
        onConfirm={handleDelete}
        variant="destructive"
        data-ai-id="tenants-delete-dialog"
      />
    </>
  );
}
