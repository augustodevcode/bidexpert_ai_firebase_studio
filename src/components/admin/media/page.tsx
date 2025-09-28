
// src/app/admin/media/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaItems, deleteMediaItem, updateMediaItemMetadata } from '@/app/admin/media/actions';
import type { MediaItem } from '@/types';
import { UploadCloud, ImageIcon as LibraryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/app/admin/media/columns';
import EditMediaDialog from '@/components/admin/media/edit-media-dialog';

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchItems = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const items = await getMediaItems();
        if (isMounted) {
          setMediaItems(items);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar itens de mídia.";
        console.error("Error fetching media items:", e);
        if (isMounted) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteMediaItem(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [toast]
  );
  
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
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive'});
    }
  };
  
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEdit }), [handleDelete]);

  return (
    <>
      <div className="space-y-6">
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
