/**
 * @fileoverview Página de listagem CRUD para VariableIncrementRule — Admin Plus.
 * Regras de incremento variável vinculadas ao PlatformSettings do tenant.
 */
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import { VariableIncrementRuleForm } from './form';
import type { VariableIncrementRuleRow } from './types';
import type { VariableIncrementRuleFormData } from './schema';
import {
  listVariableIncrementRules,
  createVariableIncrementRule,
  updateVariableIncrementRule,
  deleteVariableIncrementRule,
} from './actions';

export default function VariableIncrementRulesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<VariableIncrementRuleRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<VariableIncrementRuleRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(
    async (params: { page: number; pageSize: number; sortField?: string; sortOrder?: 'asc' | 'desc' }) => {
      const res = await listVariableIncrementRules(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    [],
  );

  const table = useDataTable<VariableIncrementRuleRow>({
    columns,
    fetchData,
    defaultPageSize: 25,
  });

  /* --- Handlers --- */
  const handleCreate = () => {
    setEditingRow(null);
    setDialogOpen(true);
  };

  const handleEdit = (row: VariableIncrementRuleRow) => {
    setEditingRow(row);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: VariableIncrementRuleFormData) => {
    setSubmitting(true);
    try {
      const res = editingRow
        ? await updateVariableIncrementRule({ ...data, id: editingRow.id })
        : await createVariableIncrementRule(data);

      if (!res.success) {
        toast.error(res.error ?? 'Erro ao salvar regra de incremento.');
        return;
      }
      toast.success(editingRow ? 'Regra atualizada.' : 'Regra criada.');
      setDialogOpen(false);
      table.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    setSubmitting(true);
    try {
      const res = await deleteVariableIncrementRule({ id: deleteRow.id });
      if (!res.success) {
        toast.error(res.error ?? 'Erro ao excluir regra.');
        return;
      }
      toast.success('Regra excluída.');
      setDeleteRow(null);
      table.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-ai-id="variable-increment-rules-page">
      <PageHeader
        title="Regras de Incremento Variável"
        description="Defina faixas de valor e incrementos para lances automáticos."
        icon={TrendingUp}
        onAdd={handleCreate}
      />

      <DataTablePlus
        table={table.table}
        columns={columns}
        loading={table.loading}
        onEdit={handleEdit}
        onDelete={(row) => setDeleteRow(row)}
        pagination={table.pagination}
        data-ai-id="variable-increment-rules-data-table"
      />

      <VariableIncrementRuleForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={editingRow}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={(open) => !open && setDeleteRow(null)}
        title="Excluir Regra de Incremento"
        description={`Deseja excluir a regra de R$ ${deleteRow?.from?.toLocaleString('pt-BR')} até ${deleteRow?.to != null ? 'R$ ' + deleteRow.to.toLocaleString('pt-BR') : '∞'}?`}
        onConfirm={handleDelete}
        loading={submitting}
      />
    </div>
  );
}
