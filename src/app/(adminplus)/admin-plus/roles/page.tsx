/**
 * @fileoverview Página de listagem de Roles no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import type { BulkAction } from '@/lib/admin-plus/types';
import type { Role } from '@/types';
import { getRoleColumns } from './columns';
import { listRolesAction, deleteRoleAction } from './actions';

export default function RolesPage() {
  const router = useRouter();
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listRolesAction();
    if (result.success && result.data) setData(result.data.data);
    else toast.error(result.error ?? 'Erro ao carregar perfis');
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = useCallback((row: Role) => {
    router.push(`${ADMIN_PLUS_BASE_PATH}/roles/${row.id}`);
  }, [router]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await deleteRoleAction({ id: deleteTarget.id });
    if (result.success) { toast.success('Perfil excluído com sucesso'); fetchData(); }
    else toast.error(result.error ?? 'Erro ao excluir');
    setDeleteTarget(null);
  }, [deleteTarget, fetchData]);

  const columns = useMemo(() => getRoleColumns({ onEdit: handleEdit, onDelete: setDeleteTarget }), [handleEdit]);

  const bulkActions: BulkAction<Role>[] = useMemo(() => [
    {
      label: 'Excluir Selecionados',
      variant: 'destructive' as const,
      onExecute: async (rows) => {
        let ok = 0;
        for (const row of rows) {
          const r = await deleteRoleAction({ id: row.id });
          if (r.success) ok++;
        }
        toast.success(`${ok} de ${rows.length} excluídos`);
        fetchData();
      },
    },
  ], [fetchData]);

  return (
    <div className="space-y-6" data-ai-id="roles-listing-page">
      <PageHeader heading="Perfis (Roles)" description="Gerencie os perfis de acesso do sistema.">
        <Button onClick={() => router.push(`${ADMIN_PLUS_BASE_PATH}/roles/new`)} data-ai-id="role-new-btn">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Novo Perfil
        </Button>
      </PageHeader>

      <DataTablePlus columns={columns} data={data} loading={loading} bulkActions={bulkActions} searchColumn="name" searchPlaceholder="Buscar por nome…" />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir Perfil"
        description={`Deseja excluir "${deleteTarget?.name}"? Perfis com usuários vinculados não podem ser excluídos.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
