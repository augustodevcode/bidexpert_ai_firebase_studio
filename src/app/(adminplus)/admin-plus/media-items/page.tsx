/**
 * @fileoverview Página CRUD de MediaItem — Admin Plus.
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Image } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import { getMediaItemColumns } from './columns';
import {
  listMediaItems,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
} from './actions';
import { MediaItemForm } from './form';
import type { MediaItemRow } from './types';

export default function MediaItemsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<MediaItemRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<MediaItemRow | null>(null);

  const table = useDataTable<MediaItemRow>({
    queryKey: 'media-items',
    fetchFn: listMediaItems,
    defaultSort: { field: 'uploadedAt', direction: 'desc' },
  });

  const handleEdit = useCallback((row: MediaItemRow) => {
    setEditRow(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: MediaItemRow) => {
    setDeleteRow(row);
  }, []);

  const columns = useMemo(
    () => getMediaItemColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      const res = editRow
        ? await updateMediaItem({ id: editRow.id, data: values as Parameters<typeof updateMediaItem>[0]['data'] })
        : await createMediaItem(values as Parameters<typeof createMediaItem>[0]);
      if (res?.success) {
        toast.success(editRow ? 'Mídia atualizada' : 'Mídia criada');
        setFormOpen(false);
        setEditRow(null);
        table.refresh();
      } else {
        toast.error(res?.error ?? 'Erro ao salvar');
      }
    },
    [editRow, table],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteRow) return;
    const res = await deleteMediaItem({ id: deleteRow.id });
    if (res?.success) {
      toast.success('Mídia excluída');
      setDeleteRow(null);
      table.refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir');
    }
  }, [deleteRow, table]);

  return (
    <div className="space-y-6" data-ai-id="media-items-page">
      <PageHeader
        title="Mídias"
        description="Gerenciar itens de mídia (imagens, documentos)"
        icon={Image}
        onAdd={() => { setEditRow(null); setFormOpen(true); }}
        addLabel="Nova Mídia"
      />

      <DataTablePlus
        columns={columns}
        data={table.data}
        isLoading={table.isLoading}
        onRowDoubleClick={handleEdit}
        data-ai-id="media-items-data-table"
      />

      <MediaItemForm
        open={formOpen}
        onOpenChange={(v) => {
          if (!v) { setFormOpen(false); setEditRow(null); } else setFormOpen(true);
        }}
        onSubmit={handleSubmit}
        defaultValues={editRow}
      />

      <ConfirmationDialog
        open={!!deleteRow}
        onOpenChange={(v) => !v && setDeleteRow(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Mídia"
        description={`Excluir "${deleteRow?.fileName}"? Esta ação não pode ser desfeita.`}
        data-ai-id="media-items-delete-dialog"
      />
    </div>
  );
}
