/**
 * @fileoverview Galeria Google Photos-like para Biblioteca de Mídia.
 * Exibe thumbnails de Mídia em grid responsivo com seleção, overlays e badges de entidade.
 * Modos: grid (masonry), rows (fileiras), list (tabela compacta).
 * data-ai-id="media-gallery-view"
 */
'use client';

import { useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MediaEntityBadges } from './media-entity-badge';
import type { MediaItemWithLinks } from '@/app/admin/media/actions';
import type { ViewMode } from './media-toolbar';
import {
  Check, ImageIcon, FileText, Eye, Pencil, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MediaGalleryViewProps {
  items: MediaItemWithLinks[];
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onSelect: (id: string, mode: 'toggle' | 'range' | 'single') => void;
  onOpen: (index: number) => void;
  onEdit: (item: MediaItemWithLinks) => void;
  onDelete: (id: string) => void;
  onSidebarOpen: (item: MediaItemWithLinks) => void;
  isLoading?: boolean;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType?: string | null) {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf') return FileText;
  return ImageIcon;
}

function MediaThumbnail({ item, isImage }: { item: MediaItemWithLinks; isImage: boolean }) {
  if (isImage && item.urlThumbnail) {
    return (
      <Image
        src={item.urlThumbnail}
        alt={item.altText || item.fileName || ''}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        unoptimized
      />
    );
  }
  if (isImage && item.urlOriginal) {
    return (
      <Image
        src={item.urlOriginal}
        alt={item.altText || item.fileName || ''}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        unoptimized
      />
    );
  }
  const IconComp = getFileIcon(item.mimeType);
  return (
    <div className="flex items-center justify-center w-full h-full bg-muted/50">
      <IconComp className="h-12 w-12 text-muted-foreground/40" />
    </div>
  );
}

/** Grid mode: masonry-like responsive grid */
function GridCard({
  item, index, isSelected, onSelect, onOpen, onEdit, onDelete, onSidebarOpen,
}: {
  item: MediaItemWithLinks; index: number; isSelected: boolean;
  onSelect: (id: string, mode: 'toggle' | 'range' | 'single') => void;
  onOpen: (index: number) => void;
  onEdit: (item: MediaItemWithLinks) => void;
  onDelete: (id: string) => void;
  onSidebarOpen: (item: MediaItemWithLinks) => void;
}) {
  const isImage = item.mimeType?.startsWith('image/') || false;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey) {
      onSelect(item.id, 'range');
    } else if (e.ctrlKey || e.metaKey) {
      onSelect(item.id, 'toggle');
    } else {
      onSidebarOpen(item);
    }
  }, [item, onSelect, onSidebarOpen]);

  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden border bg-card cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        isSelected && 'ring-2 ring-primary border-primary shadow-md'
      )}
      onClick={handleClick}
      data-ai-id="media-gallery-card"
      data-media-id={item.id}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <MediaThumbnail item={item} isImage={isImage} />

        {/* Selection checkbox overlay */}
        <div
          className={cn(
            'absolute top-2 left-2 z-10 transition-opacity',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(item.id, 'toggle'); }}
            className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors',
              isSelected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background/80 border-muted-foreground/50 hover:border-primary'
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Quick action overlay */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {isImage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary" size="icon"
                  className="h-7 w-7 bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={(e) => { e.stopPropagation(); onOpen(index); }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Visualizar</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary" size="icon"
                className="h-7 w-7 bg-background/80 backdrop-blur-sm shadow-sm"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive" size="icon"
                className="h-7 w-7 shadow-sm"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Excluir</TooltipContent>
          </Tooltip>
        </div>

        {/* Entity badges at bottom of thumbnail */}
        {item.entityLinks && item.entityLinks.length > 0 && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10">
            <MediaEntityBadges links={item.entityLinks} maxVisible={2} compact />
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-2.5 py-2 space-y-0.5">
        <p className="text-xs font-medium truncate" title={item.title || item.fileName || ''}>
          {item.title || item.fileName}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {formatFileSize(item.sizeBytes)}
          </span>
          {item.mimeType && !item.mimeType.startsWith('image/') && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
              {item.mimeType.split('/')[1]?.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

/** List mode (compact table-like view) */
function ListRow({
  item, index, isSelected, onSelect, onOpen, onEdit, onDelete, onSidebarOpen,
}: {
  item: MediaItemWithLinks; index: number; isSelected: boolean;
  onSelect: (id: string, mode: 'toggle' | 'range' | 'single') => void;
  onOpen: (index: number) => void;
  onEdit: (item: MediaItemWithLinks) => void;
  onDelete: (id: string) => void;
  onSidebarOpen: (item: MediaItemWithLinks) => void;
}) {
  const isImage = item.mimeType?.startsWith('image/') || false;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-md border bg-card cursor-pointer transition-all',
        'hover:bg-accent/50 hover:border-primary/20',
        isSelected && 'ring-1 ring-primary bg-primary/5 border-primary/30'
      )}
      onClick={(e) => {
        if (e.shiftKey) onSelect(item.id, 'range');
        else if (e.ctrlKey || e.metaKey) onSelect(item.id, 'toggle');
        else onSidebarOpen(item);
      }}
      data-ai-id="media-gallery-list-row"
      data-media-id={item.id}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(item.id, 'toggle'); }}
        className={cn(
          'h-5 w-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors',
          isSelected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground/40 hover:border-primary'
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </button>

      {/* Thumbnail */}
      <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-muted/30">
        <MediaThumbnail item={item} isImage={isImage} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title || item.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {item.mimeType?.split('/')[1]?.toUpperCase()} ┬À {formatFileSize(item.sizeBytes)}
          {item.uploadedAt && ` ┬À ${new Date(item.uploadedAt).toLocaleDateString('pt-BR')}`}
        </p>
      </div>

      {/* Entity badges */}
      {item.entityLinks && item.entityLinks.length > 0 && (
        <div className="hidden sm:block flex-shrink-0">
          <MediaEntityBadges links={item.entityLinks} maxVisible={3} compact />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isImage && (
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); onOpen(index); }}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function MediaGalleryView({
  items, viewMode, selectedIds, onSelect, onOpen, onEdit, onDelete, onSidebarOpen, isLoading,
}: MediaGalleryViewProps) {
  const lastSelectedRef = useRef<number>(-1);

  const handleSelect = useCallback((id: string, mode: 'toggle' | 'range' | 'single') => {
    const idx = items.findIndex(i => i.id === id);
    if (mode === 'range' && lastSelectedRef.current >= 0) {
      const start = Math.min(lastSelectedRef.current, idx);
      const end = Math.max(lastSelectedRef.current, idx);
      for (let i = start; i <= end; i++) {
        onSelect(items[i].id, 'toggle');
      }
    } else {
      onSelect(id, mode);
      lastSelectedRef.current = idx;
    }
  }, [items, onSelect]);

  const imageItems = useMemo(
    () => items.filter(i => i.mimeType?.startsWith('image/')),
    [items]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" data-ai-id="media-gallery-loading">
        <div className="animate-pulse space-y-3 text-center">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted/50" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Carregando Mídia...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center" data-ai-id="media-gallery-empty">
        <ImageIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">Nenhum arquivo encontrado</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Envie sua primeira Mídia ou ajuste os filtros
        </p>
      </div>
    );
  }

  // List mode
  if (viewMode === 'list') {
    return (
      <div className="space-y-1" data-ai-id="media-gallery-view" data-view-mode="list">
        {items.map((item) => {
          const imageIndex = imageItems.findIndex(i => i.id === item.id);
          return (
            <ListRow
              key={item.id}
              item={item}
              index={imageIndex >= 0 ? imageIndex : 0}
              isSelected={selectedIds.has(item.id)}
              onSelect={handleSelect}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              onSidebarOpen={onSidebarOpen}
            />
          );
        })}
      </div>
    );
  }

  // Grid / Rows mode
  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4';

  return (
    <div className={gridClass} data-ai-id="media-gallery-view" data-view-mode={viewMode}>
      {items.map((item) => {
        const imageIndex = imageItems.findIndex(i => i.id === item.id);
        return (
          <GridCard
            key={item.id}
            item={item}
            index={imageIndex >= 0 ? imageIndex : 0}
            isSelected={selectedIds.has(item.id)}
            onSelect={handleSelect}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            onSidebarOpen={onSidebarOpen}
          />
        );
      })}
    </div>
  );
}

