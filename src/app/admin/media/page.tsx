
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaItems, deleteMediaItem } from './actions'; 
import type { MediaItem } from '@/types';
import { UploadCloud, Filter, Edit2, Trash2, AlertTriangle, Loader2, ImageIcon as LibraryIcon, List, LayoutGrid, FileText, ChevronDown } from 'lucide-react'; // Adicionado ChevronDown
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // Adicionado SelectItem
import { useEffect, useState, useCallback } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';


export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); 

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getMediaItems();
      setMediaItems(items);
    } catch (e: any) {
      toast({ title: "Erro", description: "Falha ao buscar itens de mídia: " + e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
      fetchItems(); 
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
            {/* Toolbar */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled>Ações em massa <ChevronDown className="ml-2 h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem disabled>Excluir selecionados</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                 <Select defaultValue="all" disabled>
                  <SelectTrigger className="h-9 w-auto text-xs sm:text-sm min-w-[150px]" disabled>
                    <SelectValue placeholder="Todas as mídias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as mídias</SelectItem>
                    <SelectItem value="image">Imagens</SelectItem>
                    <SelectItem value="document">Documentos</SelectItem>
                  </SelectContent>
                </Select>
                 <Select defaultValue="all" disabled>
                  <SelectTrigger className="h-9 w-auto text-xs sm:text-sm min-w-[150px]" disabled>
                    <SelectValue placeholder="Todas as datas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as datas</SelectItem>
                    {/* Add date options later */}
                  </SelectContent>
                </Select>
                 <Button variant="outline" size="sm" className="h-9" disabled>Filtrar</Button>
              </div>
              <div className="flex items-center gap-2">
                 <Input placeholder="Pesquisar mídia..." className="h-9 max-w-xs" disabled />
                <span className="text-sm text-muted-foreground whitespace-nowrap">{mediaItems.length} itens</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')} className="h-9 w-9" aria-label="Ver em Lista">
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Ver em Lista</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-9 w-9" aria-label="Ver em Grade">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Ver em Grade</p></TooltipContent>
                </Tooltip>
              </div>
            </div>

            {mediaItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhuma mídia encontrada.</p>
                <p className="text-sm">Comece fazendo upload de novos arquivos.</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox aria-label="Selecionar todos" disabled />
                      </TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead className="hidden md:table-cell">Autor</TableHead>
                      <TableHead className="hidden lg:table-cell">Anexado a</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mediaItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox aria-label={`Selecionar ${item.title || item.fileName}`} disabled />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
                              {item.mimeType?.startsWith('image/') ? (
                                <Image
                                  src={item.urlThumbnail || item.urlOriginal}
                                  alt={item.altText || item.title || item.fileName}
                                  fill
                                  className="object-contain"
                                  data-ai-hint={item.dataAiHint || 'miniatura midia'}
                                />
                              ) : (
                                <FileText className="h-full w-full p-2 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-foreground truncate max-w-[150px] sm:max-w-[200px]" title={item.title || item.fileName}>
                                {item.title || item.fileName}
                              </span>
                              <span className="text-xs text-muted-foreground">{item.mimeType}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.uploadedBy || 'Admin (Exemplo)'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {item.linkedLotIds && item.linkedLotIds.length > 0 
                            ? `Lote(s): ${item.linkedLotIds.join(', ').substring(0,20)}...` 
                            : 'Não anexado'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {item.uploadedAt ? format(new Date(item.uploadedAt), 'dd/MM/yy HH:mm', { locale: ptBR }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditMetadata(item.id)}>
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Editar Metadados</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Metadados (Em breve)</p></TooltipContent>
                          </Tooltip>
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" aria-label="Excluir Mídia">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent><p>Excluir Mídia</p></TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a mídia "{item.title || item.fileName}"? Esta ação não pode ser desfeita.
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : ( 
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mediaItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden group relative">
                    <div className="aspect-square relative bg-muted">
                       {item.mimeType?.startsWith('image/') ? (
                        <Image
                            src={item.urlThumbnail || item.urlOriginal}
                            alt={item.altText || item.title || item.fileName}
                            fill
                            className="object-cover"
                            data-ai-hint={item.dataAiHint || 'miniatura midia'}
                        />
                        ) : (
                        <div className="flex items-center justify-center h-full">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                        )}
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
                                  <Button variant="destructive" size="icon" className="h-7 w-7" aria-label="Excluir Mídia">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent><p>Excluir Mídia</p></TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a mídia "{item.title || item.fileName}"? Esta ação não pode ser desfeita.
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
                         {item.uploadedAt ? format(new Date(item.uploadedAt), 'dd/MM/yy', { locale: ptBR }) : 'N/A'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
             {/* Placeholder for Pagination */}
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <span className="mx-4 text-sm text-muted-foreground">Página 1 de 1</span>
              <Button variant="outline" size="sm" disabled>Próxima</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
