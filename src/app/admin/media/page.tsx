
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaItems, deleteMediaItem } from './actions';
import type { MediaItem } from '@/types';
import { UploadCloud, ImageIcon as LibraryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { columns as createColumns } from './columns';

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
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
    fetchItems();
  }, [fetchItems]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteMediaItem(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        fetchItems();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [fetchItems, toast]
  );
  
  const columns = createColumns({ handleDelete });

  return (
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
            entityName="Mídia"
            entityNamePlural="Mídias"
          />
        </CardContent>
      </Card>
    </div>
  );
}
