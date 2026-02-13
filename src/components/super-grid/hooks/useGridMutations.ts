/**
 * @fileoverview Hook de mutações do SuperGrid (save/delete).
 * Usa TanStack Query Mutations com invalidação automática de cache.
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveGridRow, deleteGridRows } from '@/app/actions/grid-actions';
import { toast } from 'sonner';

interface UseGridMutationsParams {
  gridId: string;
  entity: string;
  onError?: (error: Error) => void;
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function useGridMutations({
  gridId,
  entity,
  onError,
  onSaveSuccess,
  onDeleteSuccess,
}: UseGridMutationsParams) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (variables: { data: Record<string, unknown>; id?: string }) =>
      saveGridRow(entity, variables.data, variables.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-grid', gridId] });
      toast.success('Registro salvo com sucesso!');
      onSaveSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
      onError?.(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteGridRows(entity, ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['super-grid', gridId] });
      toast.success(`${result.deleted} registro(s) excluído(s)`);
      onDeleteSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
      onError?.(error);
    },
  });

  return {
    saveMutation,
    deleteMutation,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
