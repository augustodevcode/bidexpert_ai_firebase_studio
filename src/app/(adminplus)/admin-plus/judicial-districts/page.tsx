/**
 * @fileoverview PÃ¡gina de listagem de Comarcas â€” Admin Plus.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { DataTablePlus } from '@/components/admin-plus/data-table-plus';
import { ConfirmationDialog } from '@/components/admin-plus/forms/confirmation-dialog';
import { useDataTable } from '@/hooks/admin-plus/use-data-table';
import type { JudicialDistrictRow } from './types';
import { getJudicialDistrictColumns } from './columns';
import {
  listJudicialDistricts,
  createJudicialDistrict,
  updateJudicialDistrict,
  deleteJudicialDistrict,
} from './actions';
import { JudicialDistrictForm } from './form';
import type { JudicialDistrictSchema } from './schema';

export default function JudicialDistrictsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JudicialDistrictRow | null>(null);
  const [deleting, setDeleting] = useState<JudicialDistrictRow | null>(null);

  const { data, isLoading, refresh } = useDataTable<JudicialDistrictRow>({
    fetchFn: listJudicialDistricts,
    defaultSort: { id: 'name', desc: false },
  });

  const handleEdit = useCallback((row: JudicialDistrictRow) => {
    setEditing(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((row: JudicialDistrictRow) => {
    setDeleting(row);
  }, []);

  const handleSubmit = useCallback(async (values: JudicialDistrictSchema) => {
    const res = editing
      ? await updateJudicialDistrict({ id: editing.id, ...values })
      : await createJudicialDistrict(values);
    if (res?.success) {
      toast.success(editing ? 'Comarca atualizada' : 'Comarca criada');
      setFormOpen(false);
      setEditing(null);
      refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar comarca');
    }
  }, [editing, refresh]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    const res = await deleteJudicialDistrict({ id: deleting.id });
    if (res?.success) {
      toast.success('Comarca excluÃ­da');
      setDeleting(null);
      refresh();
    } else {
      toast.error(res?.error ?? 'Erro ao excluir comarca');
    }
  }, [deleting, refresh]);

  const columns = useMemo(
    () => getJudicialDistrictColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  return (
    <div className="space-y-6 p-6" data-ai-id="judicial-districts-page">
      <PageHeader
        title="Comarcas"
        description="Gerencie as comarcas do sistema."
        icon={Landmark}
        primaryAction={{
          label: 'Nova Comarca',
          onClick: () => { setEditing(null); setFormOpen(true); },
        }}
      />

      <DataTablePlus<JudicialDistrictRow, unknown>
        data={data}
        isLoading={isLoading}
        columns={columns}
        searchPlaceholder="Buscar comarca..."
        onRowDoubleClick={handleEdit}
        data-ai-id="judicial-districts-table"
      />

      <JudicialDistrictForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        onSubmit={handleSubmit}
        defaultValues={editing}
      />

      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        title="Excluir Comarca"
        description={`Deseja excluir "${deleting?.name}"?`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
