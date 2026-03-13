/**
 * @fileoverview Página CRUD de BidderProfile (Perfil do Arrematante) — Admin Plus.
 */
'use client';

import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { columns } from './columns';
import { listBidderProfiles, deleteBidderProfile } from './actions';
import { BidderProfileForm } from './form';
import type { BidderProfileRow } from './types';

export default function BidderProfilesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<BidderProfileRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BidderProfileRow | null>(null);

  const table = useDataTable<BidderProfileRow>({
    queryKey: 'bidder-profiles',
    fetchFn: listBidderProfiles,
    defaultSort: { field: 'createdAt', order: 'desc' },
  });

  const handleEdit = (row: BidderProfileRow) => {
    setEditItem(row);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteBidderProfile({ id: deleteTarget.id });
    if (res?.success) {
      toast.success('Perfil excluído');
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" data-ai-id="bidder-profiles-page">
      <PageHeader
        title="Perfis de Arrematantes"
        description="Gerencie os perfis de arrematantes cadastrados"
        icon={UserCheck}
        onAdd={() => { setEditItem(null); setFormOpen(true); }}
        addLabel="Novo Perfil"
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

      <BidderProfileForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={table.refresh}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir perfil"
        description={`Deseja excluir o perfil de "${deleteTarget?.fullName ?? deleteTarget?.userName ?? ''}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
