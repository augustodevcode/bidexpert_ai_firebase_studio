/**
 * @fileoverview Página CRUD de associação User ↔ Tenant — Admin Plus.
 * Junction table com chave composta [userId, tenantId].
 */
'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import { listUserOnTenants, deleteUserOnTenant } from './actions';
import { UserOnTenantForm } from './form';
import type { UserOnTenantRow } from './types';

export default function UserOnTenantsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserOnTenantRow | null>(null);

  const table = useDataTable<UserOnTenantRow>({
    queryKey: 'user-on-tenants',
    fetchFn: listUserOnTenants,
    defaultSort: { field: 'assignedAt', order: 'desc' },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const [userId, tenantId] = deleteTarget.compositeId.split(':');
    const res = await deleteUserOnTenant({ userId, tenantId });
    if (res?.success) {
      toast.success('Associação removida');
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao remover');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" data-ai-id="user-on-tenants-page">
      <PageHeader
        title="Usuários por Tenant"
        description="Gerencie as associações entre usuários e tenants"
        icon={Users}
        onAdd={() => setFormOpen(true)}
        addLabel="Nova Associação"
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        total={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onSortChange={table.setSort}
        onSearchChange={table.setSearch}
        isLoading={table.isLoading}
        getRowId={(row) => row.compositeId}
        rowActions={[
          {
            label: 'Excluir',
            variant: 'destructive' as const,
            onClick: (row) => setDeleteTarget(row),
          },
        ]}
      />

      <UserOnTenantForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={table.refresh}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remover associação"
        description={`Deseja remover a associação de "${deleteTarget?.userName ?? ''}" com "${deleteTarget?.tenantName ?? ''}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
