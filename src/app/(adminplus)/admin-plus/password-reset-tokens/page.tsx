/**
 * @fileoverview PÃ¡gina CRUD de PasswordResetToken â€” Admin Plus.
 * Tokens efÃªmeros: criaÃ§Ã£o + exclusÃ£o, sem ediÃ§Ã£o.
 */
'use client';

import { useState, useCallback } from 'react';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import { listPasswordResetTokens, createPasswordResetToken, deletePasswordResetToken } from './actions';
import { PasswordResetTokenForm } from './form';
import type { PasswordResetTokenRow } from './types';

export default function PasswordResetTokensPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<PasswordResetTokenRow | null>(null);

  const table = useDataTable<PasswordResetTokenRow>({
    fetchFn: listPasswordResetTokens,
  });

  const handleCreate = useCallback(
    async (values: Record<string, unknown>) => {
      const res = await createPasswordResetToken(values as Parameters<typeof createPasswordResetToken>[0]);
      if (res?.success) {
        toast.success('Token criado');
        setFormOpen(false);
        table.refresh();
      } else {
        toast.error(res?.error ?? 'Erro ao criar token');
      }
    },
    [table],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteRow) return;
    const res = await deletePasswordResetToken({ id: deleteRow.id });
    if (res?.success) {
      toast.success('Token excluÃ­do');
      setDeleteRow(null);
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir');
    }
  }, [deleteRow, table]);

  return (
    <div className="space-y-6" data-ai-id="password-reset-tokens-page">
      <PageHeader
        title="Tokens de Reset de Senha"
        description="Tokens gerados para recuperaÃ§Ã£o de senha"
        icon={KeyRound}
        onAdd={() => setFormOpen(true)}
        data-ai-id="prt-page-header"
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        total={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onSearchChange={table.setSearch}
        isLoading={table.isLoading}
        rowActions={(row: PasswordResetTokenRow) => [
          { label: 'Excluir', onClick: () => setDeleteRow(row), variant: 'destructive' as const },
        ]}
        data-ai-id="prt-data-table"
      />

      <PasswordResetTokenForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={(v) => !v && setDeleteRow(null)}
        onConfirm={handleDelete}
        title="Excluir Token"
        description={`Excluir token de "${deleteRow?.email}"?`}
        data-ai-id="prt-delete-dialog"
      />
    </div>
  );
}
