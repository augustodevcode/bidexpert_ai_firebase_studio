
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaItems, deleteMediaItem, handleImageUpload } from './actions'; // deleteMediaItem importado
import type { MediaItem } from '@/types';
import { PlusCircle, Image as ImageIcon, UploadCloud, Filter, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react'; // Import useState and useEffect
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

// Client Component
export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = async () => {
    setIsLoading(true);
    const items = await getMediaItems();
    setMediaItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSimulateUpload = async () => {
    // Simulate uploading one placeholder image
    const dummyMetadata: Pick<MediaItem, 'fileName' | 'mimeType' | 'sizeBytes' | 'dataAiHint'>[] = [
      { fileName: `placeholder-${Date.now()}.png`, mimeType: 'image/png', sizeBytes: 102400, dataAiHint: 'placeholder novo' }
    ];
    const result = await handleImageUpload(dummyMetadata);
    toast({
      title: result.success ? 'Upload Simulado com Sucesso' : 'Falha no Upload Simulado',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) {
      fetchItems(); // Refresh the list
    }
  };

  const handleEditMetadata = (itemId: string) => {
    toast({
      title: 'Editar Metadados (Em breve)',
      description: `A funcionalidade para editar os metadados do item ${itemId} será implementada em breve.`,
    });
  };

  const handleDeleteAction = async (id: string) => {
    const result = await deleteMediaItem(id);
    toast({
      title: result.success ? 'Exclusão Iniciada' : 'Erro na Exclusão',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) {
      fetchItems(); // Refresh the list
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando biblioteca de mídia...</p>
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <ImageIcon className="h-6 w-6 mr-2 text-primary" />
                Biblioteca de Mídia
              </CardTitle>
              <CardDescription>
                Gerencie todas as imagens de lotes e outros ativos visuais da plataforma.
              </CardDescription>
            </div>
            <Button onClick={handleSimulateUpload}>
              <UploadCloud className="mr-2 h-4 w-4" /> Simular Upload
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <Input placeholder="Buscar por nome, título..." className="max-w-sm h-9" disabled />
              <Button variant="outline" className="h-9" disabled>
                <Filter className="mr-2 h-4 w-4" /> Filtrar (Em breve)
              </Button>
            </div>

            {mediaItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhuma imagem encontrada.</p>
                <p className="text-sm">Comece fazendo upload de novas imagens.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mediaItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden group relative">
                    <div className="aspect-square relative bg-muted">
                      <Image
                        src={item.urlThumbnail}
                        alt={item.altText || item.title || item.fileName}
                        fill
                        className="object-cover"
                        data-ai-hint={item.dataAiHint || 'imagem miniatura biblioteca'}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleEditMetadata(item.id)}>
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar Metadados (Em breve)</p></TooltipContent>
                        </Tooltip>
                        
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-7 w-7" aria-label="Excluir Imagem">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p>Excluir Imagem</p></TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a imagem "{item.title || item.fileName}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAction(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </div>
                    </div>
                    <div className="p-2 text-xs">
                      <p className="font-medium truncate text-foreground" title={item.title || item.fileName}>
                        {item.title || item.fileName}
                      </p>
                      <p className="text-muted-foreground">
                        {(item.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-muted-foreground/80">
                        {format(new Date(item.uploadedAt), 'dd/MM/yy', { locale: ptBR })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
