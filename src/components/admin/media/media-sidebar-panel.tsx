/**
 * @fileoverview Painel lateral de detalhes de Mídia e edição de metadados.
 * Exibe info do arquivo, entity links, e campos edit├íveis (altText, caption, title, description).
 * data-ai-id="media-sidebar-panel"
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MediaEntityBadge } from './media-entity-badge';
import {
  Info, Link2, Pencil, Save, X, Calendar, HardDrive, FileType,
  ImageIcon, Copy,
} from 'lucide-react';
// cn available for future conditional styling
import type { MediaItemWithLinks } from '@/app/admin/media/actions';
import { updateMediaItemMetadata } from '@/app/admin/media/actions';
import { useToast } from '@/hooks/use-toast';

interface MediaSidebarPanelProps {
  item: MediaItemWithLinks | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  selectedCount?: number;
  onOpenEditor?: (item: MediaItemWithLinks) => void;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d?: Date | string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function MediaSidebarPanel({
  item, open, onClose, onRefresh, selectedCount = 0, onOpenEditor,
}: MediaSidebarPanelProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync form fields
  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setAltText(item.altText || '');
      setCaption(item.caption || '');
      setDescription(item.description || '');
      setEditMode(false);
    }
  }, [item]);

  const handleSave = useCallback(async () => {
    if (!item) return;
    setSaving(true);
    try {
      const result = await updateMediaItemMetadata(item.id, { title, altText, caption, description });
      if (result.success) {
        toast({ title: 'Salvo', description: 'Metadados atualizados com sucesso.' });
        setEditMode(false);
        onRefresh();
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar metadados.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [item, title, altText, caption, description, toast, onRefresh]);

  const isImage = item?.mimeType?.startsWith('image/') || false;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] p-0 overflow-y-auto" data-ai-id="media-sidebar-panel">
        {!item ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {selectedCount > 1 ? (
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">{selectedCount} itens selecionados</p>
                <p className="text-sm text-muted-foreground">Selecione um ├║nico item para ver detalhes</p>
              </div>
            ) : (
              <p>Selecione um item</p>
            )}
          </div>
        ) : (
          <>
            {/* Preview header */}
            <div className="relative bg-muted/30 aspect-[4/3] overflow-hidden">
              {isImage && (item.urlOriginal || item.urlThumbnail) ? (
                <Image
                  src={item.urlOriginal || item.urlThumbnail || ''}
                  alt={item.altText || item.fileName || ''}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              {isImage && onOpenEditor && (
                <Button
                  variant="secondary" size="sm"
                  className="absolute bottom-3 right-3 gap-1 bg-background/80 backdrop-blur-sm shadow"
                  onClick={() => onOpenEditor(item)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar imagem
                </Button>
              )}
            </div>

            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="text-base truncate">
                {item.title || item.fileName}
              </SheetTitle>
            </SheetHeader>

            <Tabs defaultValue="info" className="px-4 pb-4">
              <TabsList className="w-full grid grid-cols-3 mb-3">
                <TabsTrigger value="info" className="gap-1 text-xs">
                  <Info className="h-3.5 w-3.5" />Info
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-1 text-xs">
                  <Link2 className="h-3.5 w-3.5" />V├¡nculos
                </TabsTrigger>
                <TabsTrigger value="edit" className="gap-1 text-xs">
                  <Pencil className="h-3.5 w-3.5" />Metadados
                </TabsTrigger>
              </TabsList>

              {/* Tab: Info */}
              <TabsContent value="info" className="space-y-3 mt-0">
                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <FileType className="h-3.5 w-3.5" />Arquivo
                  </span>
                  <span className="truncate font-mono text-xs">{item.fileName}</span>

                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />Tipo
                  </span>
                  <Badge variant="outline" className="w-fit text-xs">
                    {item.mimeType || 'Desconhecido'}
                  </Badge>

                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5" />Tamanho
                  </span>
                  <span>{formatFileSize(item.sizeBytes)}</span>

                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />Upload
                  </span>
                  <span className="text-xs">{formatDate(item.uploadedAt)}</span>
                </div>

                <Separator />

                {/* URL original */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">URL Original</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={item.urlOriginal || ''}
                      readOnly
                      className="h-7 text-xs font-mono"
                    />
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"
                      onClick={() => copyToClipboard(item.urlOriginal || '')}
                      title="Copiar URL"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Entity Links */}
              <TabsContent value="links" className="space-y-3 mt-0">
                {item.entityLinks && item.entityLinks.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {item.entityLinks.length} entidade{item.entityLinks.length > 1 ? 's' : ''} vinculada{item.entityLinks.length > 1 ? 's' : ''}
                    </p>
                    <div className="space-y-1.5">
                      {item.entityLinks.map((link, i) => (
                        <MediaEntityBadge key={`${link.entityType}-${link.entityId}-${i}`} link={link} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Link2 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma entidade vinculada</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Vincule esta Mídia a Lotes, Leilões, ou outros itens
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Edit metadata */}
              <TabsContent value="edit" className="space-y-3 mt-0">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="media-title" className="text-xs">título</Label>
                    <Input
                      id="media-title"
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); setEditMode(true); }}
                      placeholder="título descritivo..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="media-alt" className="text-xs">Texto Alternativo (SEO)</Label>
                    <Input
                      id="media-alt"
                      value={altText}
                      onChange={(e) => { setAltText(e.target.value); setEditMode(true); }}
                      placeholder="Descri├º├úo para acessibilidade e SEO..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="media-caption" className="text-xs">Legenda</Label>
                    <Input
                      id="media-caption"
                      value={caption}
                      onChange={(e) => { setCaption(e.target.value); setEditMode(true); }}
                      placeholder="Legenda para exibi├º├úo..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="media-description" className="text-xs">Descri├º├úo</Label>
                    <Textarea
                      id="media-description"
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setEditMode(true); }}
                      placeholder="Descri├º├úo detalhada..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>

                  {editMode && (
                    <div className="flex gap-2 pt-1">
                      <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1 flex-1">
                        <Save className="h-3.5 w-3.5" />
                        {saving ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => {
                          setTitle(item.title || '');
                          setAltText(item.altText || '');
                          setCaption(item.caption || '');
                          setDescription(item.description || '');
                          setEditMode(false);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

