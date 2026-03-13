/**
 * @fileoverview Página CRUD de Auctioneers (Leiloeiros) — Admin Plus.
 */
'use client';

import { useState } from 'react';
import { Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import { listAuctioneers, deleteAuctioneer } from './actions';
import { AuctioneerForm } from './form';
import type { AuctioneerRow } from './types';

export default function AuctioneersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AuctioneerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuctioneerRow | null>(null);

  const table = useDataTable<AuctioneerRow>({
    queryKey: 'auctioneers',
    fetchFn: listAuctioneers,
    defaultSort: { field: 'createdAt', order: 'desc' },
  });

  const handleEdit = (row: AuctioneerRow) => {
    setEditItem(row);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteAuctioneer({ id: deleteTarget.id });
    if (res?.success) {
      toast.success('Leiloeiro excluído');
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" data-ai-id="auctioneers-page">
      <PageHeader
        title="Leiloeiros"
        description="Gerencie os leiloeiros cadastrados na plataforma"
        icon={Gavel}
        onAdd={() => { setEditItem(null); setFormOpen(true); }}
        addLabel="Novo Leiloeiro"
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
        getRowId={(row) => row.id}
        rowActions={[
          { label: 'Editar', onClick: handleEdit },
          { label: 'Excluir', variant: 'destructive' as const, onClick: (row) => setDeleteTarget(row) },
        ]}
      />

      <AuctioneerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={table.refresh}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir leiloeiro"
        description={`Deseja excluir o leiloeiro "${deleteTarget?.name ?? ''}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
