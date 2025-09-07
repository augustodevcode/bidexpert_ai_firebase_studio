// src/components/admin/resource-data-table.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';

interface ResourceDataTableProps<TData> {
  columns: (options: { handleDelete: (id: string) => void; [key: string]: any }) => ColumnDef<TData>[];
  fetchAction: () => Promise<TData[]>;
  deleteAction: (id: string) => Promise<{ success: boolean; message: string }>;
  searchColumnId: string;
  searchPlaceholder: string;
  facetedFilterColumns?: {
    id: string;
    title: string;
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
  deleteConfirmation?: (item: TData) => boolean;
  deleteConfirmationMessage?: (item: TData) => string;
  onOpenDetails?: (item: TData) => void; // Optional handler for viewing details
}

export default function ResourceDataTable<TData extends { id: string, name?: string | null }>({
  columns,
  fetchAction,
  deleteAction,
  searchColumnId,
  searchPlaceholder,
  facetedFilterColumns = [],
  deleteConfirmation,
  deleteConfirmationMessage,
  onOpenDetails,
}: ResourceDataTableProps<TData>) {
  const [data, setData] = useState<TData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedData = await fetchAction();
      setData(fetchedData);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar dados.";
      console.error(`Error fetching data for ${searchColumnId}:`, e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fetchAction, toast, searchColumnId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refetchTrigger]);

  const handleDelete = useCallback(async (id: string) => {
    const itemToDelete = data.find(item => item.id === id);
    if (deleteConfirmation && itemToDelete && !deleteConfirmation(itemToDelete)) {
      toast({
        title: "Ação não Permitida",
        description: deleteConfirmationMessage ? deleteConfirmationMessage(itemToDelete) : "Este item não pode ser excluído.",
        variant: "destructive"
      });
      return;
    }
    const result = await deleteAction(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setRefetchTrigger(c => c + 1); // Trigger refetch
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [deleteAction, toast, data, deleteConfirmation, deleteConfirmationMessage]);

  const handleDeleteSelected = useCallback(async (selectedItems: TData[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
       if (deleteConfirmation && !deleteConfirmation(item)) {
        toast({ title: `Ação não Permitida`, description: deleteConfirmationMessage ? deleteConfirmationMessage(item) : `O item "${item.name || item.id}" não pode ser excluído.`, variant: "destructive", duration: 5000 });
        errorCount++;
        continue;
      }
      const result = await deleteAction(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.name || item.id}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} item(s) excluído(s) com sucesso.` });
    }
    setRefetchTrigger(c => c + 1); // Trigger refetch
  }, [deleteAction, toast, deleteConfirmation, deleteConfirmationMessage]);

  const tableColumns = useMemo(() => columns({ handleDelete, onOpenDetails }), [columns, handleDelete, onOpenDetails]);

  return (
    <div data-ai-id={`admin-${searchColumnId}-data-table`}>
        <DataTable
        columns={tableColumns}
        data={data}
        isLoading={isLoading}
        error={error}
        searchColumnId={searchColumnId}
        searchPlaceholder={searchPlaceholder}
        facetedFilterColumns={facetedFilterColumns}
        onDeleteSelected={handleDeleteSelected}
        />
    </div>
  );
}
