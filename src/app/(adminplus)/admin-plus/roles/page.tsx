/**
 * @fileoverview Página de listagem de Roles no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import type { BulkAction } from '@/lib/admin-plus/types';
import type { Role } from '@/types';
import { getRoleColumns } from './columns';
import { listRolesAction, createRoleAction, updateRoleAction, deleteRoleAction } from './actions';
import { RoleForm } from './form';
import type { CreateRoleInput } from './schema';

export default function RolesPage() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listRolesAction(undefined as never);
    if (result.success && result.data) setData(result.data.data);
    else toast.error(result.error ?? 'Erro ao carregar perfis');
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = useCallback((row: Role) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (values: CreateRoleInput) => {
    const result = editRow
      ? await updateRoleAction({ id: editRow.id, data: values })
      : await createRoleAction(values);
    if (result.success) {
      toast.success(editRow ? 'Perfil atualizado com sucesso' : 'Perfil criado com sucesso');
      setFormOpen(false);
      setEditRow(null);
      fetchData();
    } else {
      toast.error(result.error ?? 'Erro ao salvar');
    }
  }, [editRow, fetchData]);

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
      <PageHeader
        title="Perfis (Roles)"
        description="Gerencie os perfis de acesso do sistema."
        icon={ShieldCheck}
        primaryAction={{
          label: 'Novo Perfil',
          onClick: () => { setEditRow(null); setFormOpen(true); },
        }}
      />

      <DataTablePlus
        columns={columns}
        data={data}
        isLoading={loading}
        bulkActions={bulkActions}
        searchPlaceholder="Buscar por nome…"
        onRowDoubleClick={handleEdit}
        data-ai-id="roles-data-table"
      />

      <RoleForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditRow(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

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
