/**
 * @fileoverview PÃ¡gina CRUD de associaÃ§Ã£o Users â†” Roles â€” Admin Plus.
 * Junction table com chave composta [userId, roleId].
 */
'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import { listUsersOnRoles, deleteUsersOnRoles } from './actions';
import { UsersOnRolesForm } from './form';
import type { UsersOnRolesRow } from './types';

export default function UsersOnRolesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UsersOnRolesRow | null>(null);

  const table = useDataTable<UsersOnRolesRow>({
    queryKey: 'users-on-roles',
    fetchFn: listUsersOnRoles,
    defaultSort: { field: 'assignedAt', order: 'desc' },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const [userId, roleId] = deleteTarget.compositeId.split(':');
    const res = await deleteUsersOnRoles({ userId, roleId });
    if (res?.success) {
      toast.success('AssociaÃ§Ã£o removida');
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao remover');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" data-ai-id="users-on-roles-page">
      <PageHeader
        title="Perfis por UsuÃ¡rio"
        description="Gerencie as associaÃ§Ãµes entre usuÃ¡rios e perfis de acesso"
        icon={ShieldCheck}
        onAdd={() => setFormOpen(true)}
        addLabel="Nova AtribuiÃ§Ã£o"
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

      <UsersOnRolesForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={table.refresh}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remover atribuiÃ§Ã£o"
        description={`Deseja remover o perfil "${deleteTarget?.roleName ?? ''}" do usuÃ¡rio "${deleteTarget?.userName ?? ''}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
