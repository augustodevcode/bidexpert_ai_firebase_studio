// src/app/admin/media/page.tsx
/**
 * @fileoverview Biblioteca de Mídia Google Photos-like.
 * Galeria responsiva com grid/list, lightbox, editor de imagem,
 * sidebar de detalhes, badges de entidades vinculadas, upload drag-and-drop.
 * data-ai-id="admin-media-page-container"
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getMediaItemsWithEntityLinks, deleteMediaItem, deleteMultipleMediaItems,
} from './actions';
import type { MediaItemWithLinks } from './actions';
import { ImageIcon as LibraryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { MediaToolbar, type ViewMode, type SortField, type SortDirection } from '@/components/admin/media/media-toolbar';
import { MediaGalleryView } from '@/components/admin/media/media-gallery-view';
import { MediaLightbox } from '@/components/admin/media/media-lightbox';
import { MediaSidebarPanel } from '@/components/admin/media/media-sidebar-panel';
import { MediaUploadZone } from '@/components/admin/media/media-upload-zone';
import { MediaImageEditor } from '@/components/admin/media/media-image-editor';

export default function MediaLibraryPage() {
  const { toast } = useToast();

  // Data
  const [items, setItems] = useState<MediaItemWithLinks[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterEntityType, setFilterEntityType] = useState<string | null>(null);
  const [filterFileType, setFilterFileType] = useState<string | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Panels
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [sidebarItem, setSidebarItem] = useState<MediaItemWithLinks | null>(null);
  const [editorItem, setEditorItem] = useState<MediaItemWithLinks | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMediaItemsWithEntityLinks();
      setItems(data);
    } catch (e) {
      console.error('Error fetching media:', e);
      toast({ title: 'Erro', description: 'Falha ao carregar mídia.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter & sort (client-side)
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        (item.title?.toLowerCase().includes(q)) ||
        (item.fileName?.toLowerCase().includes(q)) ||
        (item.altText?.toLowerCase().includes(q)) ||
        (item.caption?.toLowerCase().includes(q))
      );
    }

    // Filter by entity type
    if (filterEntityType) {
      result = result.filter((item) =>
        item.entityLinks?.some((l) => l.entityType === filterEntityType)
      );
    }

    // Filter by file type
    if (filterFileType) {
      result = result.filter((item) =>
        item.mimeType?.startsWith(filterFileType) || item.mimeType === filterFileType
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'uploadedAt':
          cmp = new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime();
          break;
        case 'fileName':
          cmp = (a.fileName || '').localeCompare(b.fileName || '');
          break;
        case 'sizeBytes':
          cmp = (a.sizeBytes || 0) - (b.sizeBytes || 0);
          break;
        case 'mimeType':
          cmp = (a.mimeType || '').localeCompare(b.mimeType || '');
          break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [items, searchQuery, filterEntityType, filterFileType, sortField, sortDirection]);

  // Selection handlers
  const handleSelect = useCallback((id: string, mode: 'toggle' | 'range' | 'single') => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (mode === 'toggle') {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else if (mode === 'single') {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }, []);

  // Delete handlers
  const handleDeleteSingle = useCallback(async (id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const confirmDeleteSingle = useCallback(async () => {
    if (!deleteConfirmId) return;
    const result = await deleteMediaItem(deleteConfirmId);
    if (result.success) {
      toast({ title: 'Excluído', description: result.message });
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(deleteConfirmId); return n; });
      fetchData();
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
    setDeleteConfirmId(null);
  }, [deleteConfirmId, toast, fetchData]);

  const handleBulkDelete = useCallback(async () => {
    setBulkDeleteConfirm(true);
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const result = await deleteMultipleMediaItems(ids);
    if (result.successCount > 0) {
      toast({ title: 'Exclusão em Massa', description: `${result.successCount} excluído(s).` });
    }
    if (result.errorCount > 0) {
      toast({ title: 'Erros', description: `${result.errorCount} falha(s).`, variant: 'destructive' });
    }
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    fetchData();
  }, [selectedIds, toast, fetchData]);

  // Image editor save
  const handleEditorSave = useCallback(async (blob: Blob, mode: 'copy' | 'overwrite') => {
    const formData = new FormData();
    formData.append('file', blob, `edited-image.png`);
    formData.append('mode', mode);
    if (editorItem) formData.append('originalId', editorItem.id);

    const res = await fetch('/api/media/edit', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    fetchData();
  }, [editorItem, fetchData]);

  // Lightbox items (images only)
  const imageItems = useMemo(
    () => filteredItems.filter((i) => i.mimeType?.startsWith('image/')),
    [filteredItems]
  );

  return (
    <TooltipProvider>
      <div className="space-y-4" data-ai-id="admin-media-page-container">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold font-headline flex items-center">
                  <LibraryIcon className="h-6 w-6 mr-2 text-primary" />
                  Biblioteca de Mídia
                </CardTitle>
                <CardDescription>
                  Gerencie imagens, documentos e ativos visuais da plataforma.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            <MediaToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(f, d) => { setSortField(f); setSortDirection(d); }}
              filterEntityType={filterEntityType}
              onFilterEntityTypeChange={setFilterEntityType}
              filterFileType={filterFileType}
              onFilterFileTypeChange={setFilterFileType}
              selectedCount={selectedIds.size}
              onDeleteSelected={handleBulkDelete}
              onUploadClick={() => setUploadOpen(true)}
              totalCount={filteredItems.length}
            />

            {/* Upload zone */}
            <MediaUploadZone
              userId=""
              onUploadComplete={fetchData}
              isOpen={uploadOpen}
              onClose={() => setUploadOpen(false)}
            />

            {/* Gallery */}
            <MediaGalleryView
              items={filteredItems}
              viewMode={viewMode}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onOpen={(index) => setLightboxIndex(index)}
              onEdit={(item) => setEditorItem(item)}
              onDelete={handleDeleteSingle}
              onSidebarOpen={(item) => setSidebarItem(item)}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Lightbox */}
        <MediaLightbox
          items={imageItems}
          open={lightboxIndex >= 0}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />

        {/* Sidebar */}
        <MediaSidebarPanel
          item={sidebarItem}
          open={!!sidebarItem}
          onClose={() => setSidebarItem(null)}
          onRefresh={fetchData}
          selectedCount={selectedIds.size}
          onOpenEditor={(item) => { setSidebarItem(null); setEditorItem(item); }}
        />

        {/* Image Editor */}
        <MediaImageEditor
          item={editorItem}
          open={!!editorItem}
          onClose={() => setEditorItem(null)}
          onSave={handleEditorSave}
        />

        {/* Delete confirmation dialogs */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={(v) => !v && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O arquivo será permanentemente removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSingle} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkDeleteConfirm} onOpenChange={(v) => !v && setBulkDeleteConfirm(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {selectedIds.size} Itens</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedIds.size} arquivo(s) serão permanentemente removidos. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground">
                Excluir Todos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
