
'use client';

import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getMediaItems } from '@/app/admin/media/actions';
import type { MediaItem } from '@/types';
import Image from 'next/image';
import { UploadCloud, Loader2, ImagePlus, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface UploadResult {
  success: boolean;
  message: string;
  items?: MediaItem[];
  errors?: { fileName: string; message: string }[];
}

interface ChooseMediaDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMediaSelect: (selectedItems: Partial<MediaItem>[]) => void;
  allowMultiple?: boolean;
}

function MediaUploadTab({ onUploadComplete }: { onUploadComplete: (uploadedItems: MediaItem[]) => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRefTab = useRef<HTMLInputElement>(null);

  const processFilesForTab = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({ title: 'Nenhum arquivo selecionado', variant: 'destructive'});
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result: UploadResult = await response.json();
        
        if (response.ok && result.success && result.items) {
          toast({
            title: 'Upload Concluído',
            description: result.message,
          });
          onUploadComplete(result.items);
        } else {
          // Handle partial successes or full failures
           const errorMessage = result.errors ? result.errors.map(e => `${e.fileName}: ${e.message}`).join(', ') : result.message;
           throw new Error(errorMessage || `Erro HTTP: ${response.status}`);
        }
    } catch (error: any) {
        toast({
          title: 'Falha no Upload',
          description: error.message || 'Ocorreu um erro na comunicação com o servidor.',
          variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
        if (fileInputRefTab.current) {
            fileInputRefTab.current.value = '';
        }
    }
  };

  const handleFileSelectForTab = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await processFilesForTab(event.target.files);
  };

  const handleDropForTab = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await processFilesForTab(event.dataTransfer.files);
  };

  const handleDragOverForTab = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="space-y-4 p-4">
      <div
        className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center space-y-3 hover:border-primary/70 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDrop={isLoading ? undefined : handleDropForTab}
        onDragOver={isLoading ? undefined : handleDragOverForTab}
      >
        {isLoading ? (
          <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
        ) : (
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground/70" />
        )}
        <p className="text-md font-medium text-muted-foreground">
          {isLoading ? 'Processando...' : 'Solte arquivos aqui para enviar'}
        </p>
        <p className="text-xs text-muted-foreground">ou</p>
        <Input
          id="tab-file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelectForTab}
          accept="image/png, image/jpeg, image/webp, application/pdf"
          disabled={isLoading}
          ref={fileInputRefTab}
        />
        <Label
          htmlFor="tab-file-upload"
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 py-2
          ${isLoading ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'}`}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
          ) : (
            'Selecionar Arquivos'
          )}
        </Label>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        <p>Tamanho máximo de upload: 10MB. Formatos: PNG, JPG, WEBP, PDF.</p>
      </div>
    </div>
  );
}


export default function ChooseMediaDialog({ 
  isOpen, 
  onOpenChange, 
  onMediaSelect, 
  allowMultiple = false
}: ChooseMediaDialogProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState('library');


  const fetchLibraryItems = async () => {
    setIsLoadingLibrary(true);
    try {
      const items = await getMediaItems();
      setMediaItems(items);
    } catch (error) {
      console.error("Failed to fetch media items for dialog:", error);
      setMediaItems([]);
    }
    setIsLoadingLibrary(false);
  };

  useEffect(() => {
    if (isOpen && currentTab === 'library') {
      fetchLibraryItems();
    }
    if (isOpen) {
      setSelectedItemIds([]); 
    }
  }, [isOpen, currentTab]);

  const handleItemSelectToggle = (itemId: string) => {
    setSelectedItemIds(prevSelected => {
      if (allowMultiple) {
        return prevSelected.includes(itemId)
          ? prevSelected.filter(id => id !== itemId)
          : [...prevSelected, itemId];
      } else {
        return prevSelected.includes(itemId) ? [] : [itemId];
      }
    });
  };
  
  const handleConfirmSelection = () => {
    const selected = mediaItems.filter(item => selectedItemIds.includes(item.id));
    onMediaSelect(selected);
    onOpenChange(false);
  };

  const handleUploadAndRefresh = async (uploadedItems: MediaItem[]) => {
    await fetchLibraryItems();
    setCurrentTab('library');
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl">Adicionar Mídia</DialogTitle>
          <DialogDescription>
            {allowMultiple ? "Selecione um ou mais arquivos." : "Selecione um arquivo."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-grow flex flex-col min-h-0">
          <TabsList className="mx-4 mt-0 mb-2">
            <TabsTrigger value="upload">Enviar arquivos</TabsTrigger>
            <TabsTrigger value="library">Biblioteca de mídia</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-grow overflow-y-auto">
            <MediaUploadTab onUploadComplete={handleUploadAndRefresh} />
          </TabsContent>

          <TabsContent value="library" className="flex-grow flex flex-col min-h-0 overflow-hidden p-4">
            {isLoadingLibrary ? (
              <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Carregando biblioteca...</p>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex-grow flex items-center justify-center text-muted-foreground">
                Nenhuma mídia encontrada na biblioteca.
              </div>
            ) : (
              <ScrollArea className="flex-grow -mx-4">
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 p-4">
                  {mediaItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "overflow-hidden group relative cursor-pointer transition-all",
                          isSelected ? "ring-2 ring-primary ring-offset-2 shadow-lg" : "hover:shadow-md"
                        )}
                        onClick={() => handleItemSelectToggle(item.id)}
                      >
                        <div className="aspect-square relative bg-muted">
                          {item.mimeType?.startsWith('image/') ? (
                            <Image
                              src={item.urlThumbnail || item.urlOriginal}
                              alt={item.altText || item.title || item.fileName}
                              fill
                              className="object-cover"
                              data-ai-hint={item.dataAiHint || 'miniatura biblioteca'}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <FileText className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-1.5">
                             <p className="text-xs text-white truncate font-medium" title={item.title || item.fileName}>
                                {item.title || item.fileName}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirmSelection} disabled={selectedItemIds.length === 0}>
            {allowMultiple ? `Adicionar (${selectedItemIds.length})` : 'Selecionar Mídia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
