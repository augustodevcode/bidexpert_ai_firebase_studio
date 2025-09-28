// src/app/admin/media/page.tsx
/**
 * @fileoverview Página principal para o gerenciamento da Biblioteca de Mídia.
 * Exibe uma DataTable com todos os itens de mídia, permitindo busca, ordenação
 * e ações como exclusão e edição de metadados através de um modal.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaItems, deleteMediaItem, updateMediaItemMetadata } from './actions';
import type { MediaItem } from '@/types';
import { UploadCloud, ImageIcon as LibraryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import EditMediaDialog from '@/components/admin/media/edit-media-dialog';

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getMediaItems();
      setMediaItems(items);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar itens de mídia.";
      console.error("Error fetching media items:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [refetchTrigger, fetchPageData]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteMediaItem(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        fetchPageData();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [toast, fetchPageData]
  );
  
  const handleDeleteSelected = useCallback(async (selectedItems: MediaItem[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteMediaItem(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.fileName}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} item(ns) de mídia excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);

  const handleEdit = (item: MediaItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMetadata = async (id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>) => {
    const result = await updateMediaItemMetadata(id, metadata);
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Metadados atualizados.'});
      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchPageData();
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive'});
    }
  };
  
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEdit }), [handleDelete]);

  return (
    <>
      <div className="space-y-6" data-ai-id="admin-media-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <LibraryIcon className="h-6 w-6 mr-2 text-primary" />
                Biblioteca de Mídia
              </CardTitle>
              <CardDescription>
                Gerencie todas as imagens de lotes e outros ativos visuais da plataforma.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/media/upload">
                <UploadCloud className="mr-2 h-4 w-4" /> Enviar Nova Mídia
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             <DataTable
              columns={columns}
              data={mediaItems}
              isLoading={isLoading}
              error={error}
              searchColumnId="title"
              searchPlaceholder="Buscar por título ou nome do arquivo..."
              onDeleteSelected={handleDeleteSelected}
            />
          </CardContent>
        </Card>
      </div>
      <EditMediaDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mediaItem={editingItem}
        onUpdate={handleUpdateMetadata}
      />
    </>
  );
}
