/**
 * Página de listagem de Lances Máximos por Lote/Usuário (UserLotMaxBid).
 */
'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/admin-plus/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getUserLotMaxBidColumns } from './columns';
import { UserLotMaxBidForm } from './form';
import { listUserLotMaxBids, createUserLotMaxBid, updateUserLotMaxBid, deleteUserLotMaxBid } from './actions';
import type { UserLotMaxBidRow } from './types';
import type { UserLotMaxBidFormData } from './schema';

export default function UserLotMaxBidsPage() {
  const dt = useDataTable<UserLotMaxBidRow, UserLotMaxBidFormData>({
    listAction: listUserLotMaxBids,
    createAction: createUserLotMaxBid,
    updateAction: updateUserLotMaxBid,
    deleteAction: deleteUserLotMaxBid,
    entityLabel: 'Lance Máximo',
    defaultSort: { id: 'createdAt', desc: true },
  });

  const columns = useMemo(() => getUserLotMaxBidColumns({ onEdit: dt.handleEdit, onDelete: dt.handleDelete }), [dt.handleEdit, dt.handleDelete]);

  return (
    <div className="space-y-4" data-ai-id="user-lot-max-bids-page">
      <PageHeader title="Lances Máximos" icon={TrendingUp} onAdd={() => dt.setFormOpen(true)} />
      <DataTablePlus columns={columns} data={dt.data} total={dt.total} page={dt.page} pageSize={dt.pageSize} onPageChange={dt.setPage} onPageSizeChange={dt.setPageSize} sorting={dt.sorting} onSortingChange={dt.setSorting} search={dt.search} onSearchChange={dt.setSearch} isLoading={dt.isLoading} onRowDoubleClick={dt.handleEdit} />
      <UserLotMaxBidForm open={dt.formOpen} onOpenChange={dt.setFormOpen} onSubmit={dt.handleSubmit} defaultValues={dt.editingRow} />
      {dt.confirmDelete}
    </div>
  );
}
