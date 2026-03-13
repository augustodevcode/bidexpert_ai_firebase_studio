/**
 * @fileoverview PÃ¡gina CRUD de Sellers (Vendedores) â€” Admin Plus.
 */
'use client';

import { useState } from 'react';
import { Store } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import { listSellers, deleteSeller } from './actions';
import { SellerForm } from './form';
import type { SellerRow } from './types';

export default function SellersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<SellerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SellerRow | null>(null);

  const table = useDataTable<SellerRow>({
    queryKey: 'sellers',
    fetchFn: listSellers,
    defaultSort: { field: 'createdAt', order: 'desc' },
  });

  const handleEdit = (row: SellerRow) => {
    setEditItem(row);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteSeller({ id: deleteTarget.id });
    if (res?.success) {
      toast.success('Vendedor excluÃ­do');
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" data-ai-id="sellers-page">
      <PageHeader
        title="Vendedores"
        description="Gerencie os vendedores (comitentes) da plataforma"
        icon={Store}
        onAdd={() => { setEditItem(null); setFormOpen(true); }}
        addLabel="Novo Vendedor"
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

      <SellerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={table.refresh}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir vendedor"
        description={`Deseja excluir o vendedor "${deleteTarget?.name ?? ''}"? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
