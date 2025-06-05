
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaItems } from './actions';
import type { MediaItem } from '@/types';
import { PlusCircle, Image as ImageIcon, UploadCloud, Filter, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

// Placeholder for actual client-side upload and metadata editing modal
// For now, this page will be server-rendered with data from `getMediaItems`

export default async function MediaLibraryPage() {
  const mediaItems = await getMediaItems();

  // Placeholder for client-side actions, actual implementation would be in a client component
  async function handleDelete(id: string) {
    'use server';
    // Call deleteMediaItem action
    console.log("Attempting to delete (server-side):", id);
    // const result = await deleteMediaItem(id);
    // if (result.success) alert(result.message); else alert(result.message);
  }

  return (
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
          <Button disabled> {/* Placeholder for client component action */}
            <UploadCloud className="mr-2 h-4 w-4" /> Fazer Upload (Em breve)
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
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                      <Button variant="secondary" size="icon" className="h-7 w-7" disabled> {/* Placeholder */}
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <form action={async () => { /* 'use server'; await deleteMediaItem(item.id); */ }} className="contents">
                        <Button variant="destructive" size="icon" className="h-7 w-7" type="submit" disabled> {/* Placeholder */}
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </form>
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
  );
}
