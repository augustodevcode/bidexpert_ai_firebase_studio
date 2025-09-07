// src/app/admin/media/page.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaItems, deleteMediaItem, updateMediaItemMetadata } from './actions';
import type { MediaItem } from '@/types';
import { UploadCloud, ImageIcon as LibraryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { createColumns } from './columns';
import EditMediaDialog from '@/components/admin/media/edit-media-dialog';

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

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
      // O ResourceDataTable se encarregará de refetch
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive'});
    }
  };
  
  const columns = useMemo(() => createColumns({ handleDelete: deleteMediaItem, onEdit: handleEdit }), []);

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
             <ResourceDataTable<MediaItem>
                columns={columns}
                fetchAction={getMediaItems}
                deleteAction={deleteMediaItem}
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
