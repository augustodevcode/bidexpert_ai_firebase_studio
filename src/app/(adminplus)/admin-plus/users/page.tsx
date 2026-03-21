/**
 * @fileoverview Página de listagem de Usuários no Admin Plus.
 * Exibe DataTablePlus com busca, paginação client-side e exclusão individual/em lote.
 */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { BulkAction, PaginatedResponse } from '@/lib/admin-plus/types';
import { PAGE_SIZE_OPTIONS } from '@/lib/admin-plus/constants';
import { columns, type UserRow } from './columns';
import { listUsersAction, createUserAction, updateUserAction, deleteUserAction } from './actions';
import { UserForm } from './form';
import type { CreateUserInput, UpdateUserInput } from './schema';

export default function UsersListPage() {
  const [data, setData] = useState<PaginatedResponse<UserRow>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE_OPTIONS[0],
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const result = await listUsersAction({});
    if (result.success && result.data) {
      setData(result.data);
    } else {
      toast.error(result.error ?? 'Erro ao carregar usuários');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = useCallback((row: UserRow) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (values: CreateUserInput | UpdateUserInput) => {
    const result = editRow
      ? await updateUserAction({ id: editRow.id, data: values as UpdateUserInput })
      : await createUserAction(values as CreateUserInput);
    if (result.success) {
      toast.success(editRow ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
      setFormOpen(false);
      setEditRow(null);
      fetchData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar usuário');
    }
  }, [editRow, fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteUserAction({ id: deleteTarget.id });
    if (result.success) {
      toast.success('Usuário excluído com sucesso');
      setDeleteTarget(null);
      fetchData();
    } else {
      toast.error(result.error ?? 'Erro ao excluir usuário');
    }
  };

  const bulkActions: BulkAction<UserRow>[] = useMemo(
    () => [
      {
        label: 'Excluir selecionados',
        variant: 'destructive' as const,
        onExecute: async (rows) => {
          let successCount = 0;
          for (const row of rows) {
            const r = await deleteUserAction({ id: row.id });
            if (r.success) successCount++;
          }
          toast.success(`${successCount} usuário(s) excluído(s)`);
          fetchData();
        },
      },
    ],
    [fetchData],
  );

  const tableColumns = useMemo(
    () => columns((row) => setDeleteTarget(row)),
    [],
  );

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários da plataforma."
        icon={Users}
        primaryAction={{
          label: 'Novo Usuário',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
        data-ai-id="users-list-page-header"
      />

      <DataTablePlus
        columns={tableColumns}
        data={data.data}
        totalRows={data.total}
        isLoading={isLoading}
        bulkActions={bulkActions}
        pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
        onRowDoubleClick={handleEdit}
        data-ai-id="users-list-data-table"
      />

      <UserForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${deleteTarget?.fullName}"? Esta ação é irreversível e removerá todos os dados relacionados.`}
        data-ai-id="users-delete-confirmation-dialog"
      />
    </>
  );
}
