/**
 * @fileoverview Toolbar da Biblioteca de Mídia.
 * View modes (grid/list), sort, filter por tipo de entidade, search, bulk actions.
 * data-ai-id="media-toolbar"
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Grid3X3, List, LayoutGrid, Search, SortAsc, SortDesc,
  Filter, Trash2, Upload, X, Check,
} from 'lucide-react';

export type ViewMode = 'grid' | 'rows' | 'list';
export type SortField = 'uploadedAt' | 'fileName' | 'sizeBytes' | 'mimeType';
export type SortDirection = 'asc' | 'desc';

const ENTITY_TYPES = [
  'Ativo', 'Leil├úo', 'Leiloeiro', 'Lote', 'Comitente',
  'Categoria', 'Subcategoria', 'Venda Direta',
];

const FILE_TYPES = [
  { label: 'Imagens', value: 'image' },
  { label: 'PDFs', value: 'application/pdf' },
  { label: 'SVGs', value: 'image/svg+xml' },
];

interface MediaToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  filterEntityType: string | null;
  onFilterEntityTypeChange: (type: string | null) => void;
  filterFileType: string | null;
  onFilterFileTypeChange: (type: string | null) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onUploadClick: () => void;
  totalCount: number;
}

export function MediaToolbar({
  viewMode, onViewModeChange,
  searchQuery, onSearchChange,
  sortField, sortDirection, onSortChange,
  filterEntityType, onFilterEntityTypeChange,
  filterFileType, onFilterFileTypeChange,
  selectedCount, onDeleteSelected, onUploadClick,
  totalCount,
}: MediaToolbarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="flex flex-col gap-3" data-ai-id="media-toolbar">
      {/* Row 1: Search + View Modes + Upload */}
      <div className="flex items-center gap-2">
        <div className={`relative flex-1 max-w-md transition-all ${isSearchFocused ? 'max-w-lg' : ''}`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, nome..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-9 h-9"
            data-ai-id="media-toolbar-search"
          />
          {searchQuery && (
            <Button
              variant="ghost" size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center border rounded-md bg-muted/30">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon" className="h-8 w-8 rounded-r-none"
            onClick={() => onViewModeChange('grid')}
            title="Grade"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'rows' ? 'secondary' : 'ghost'}
            size="icon" className="h-8 w-8 rounded-none border-x"
            onClick={() => onViewModeChange('rows')}
            title="Fileiras"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon" className="h-8 w-8 rounded-l-none"
            onClick={() => onViewModeChange('list')}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              {sortDirection === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
              Ordenar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { label: 'Data (mais recente)', field: 'uploadedAt' as SortField, dir: 'desc' as SortDirection },
              { label: 'Data (mais antiga)', field: 'uploadedAt' as SortField, dir: 'asc' as SortDirection },
              { label: 'Nome (A-Z)', field: 'fileName' as SortField, dir: 'asc' as SortDirection },
              { label: 'Nome (Z-A)', field: 'fileName' as SortField, dir: 'desc' as SortDirection },
              { label: 'Tamanho (menor)', field: 'sizeBytes' as SortField, dir: 'asc' as SortDirection },
              { label: 'Tamanho (maior)', field: 'sizeBytes' as SortField, dir: 'desc' as SortDirection },
            ].map((opt) => (
              <DropdownMenuItem
                key={`${opt.field}-${opt.dir}`}
                onClick={() => onSortChange(opt.field, opt.dir)}
                className="gap-2"
              >
                {sortField === opt.field && sortDirection === opt.dir && <Check className="h-3 w-3" />}
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filterEntityType || filterFileType ? 'default' : 'outline'}
              size="sm" className="h-9 gap-1"
            >
              <Filter className="h-4 w-4" />
              Filtrar
              {(filterEntityType || filterFileType) && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {[filterEntityType, filterFileType].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Por Entidade</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onFilterEntityTypeChange(null)} className="gap-2">
              {!filterEntityType && <Check className="h-3 w-3" />}
              Todas
            </DropdownMenuItem>
            {ENTITY_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onFilterEntityTypeChange(type)}
                className="gap-2"
              >
                {filterEntityType === type && <Check className="h-3 w-3" />}
                {type}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Por Tipo de Arquivo</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onFilterFileTypeChange(null)} className="gap-2">
              {!filterFileType && <Check className="h-3 w-3" />}
              Todos
            </DropdownMenuItem>
            {FILE_TYPES.map((ft) => (
              <DropdownMenuItem
                key={ft.value}
                onClick={() => onFilterFileTypeChange(ft.value)}
                className="gap-2"
              >
                {filterFileType === ft.value && <Check className="h-3 w-3" />}
                {ft.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={onUploadClick} size="sm" className="h-9 gap-1">
          <Upload className="h-4 w-4" />
          Enviar
        </Button>
      </div>

      {/* Row 2: Active filters + Selection actions + Count */}
      <div className="flex items-center gap-2 min-h-[24px]">
        <span className="text-xs text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'arquivo' : 'arquivos'}
        </span>

        {filterEntityType && (
          <Badge variant="secondary" className="gap-1 text-xs">
            {filterEntityType}
            <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterEntityTypeChange(null)} />
          </Badge>
        )}
        {filterFileType && (
          <Badge variant="secondary" className="gap-1 text-xs">
            {FILE_TYPES.find(f => f.value === filterFileType)?.label || filterFileType}
            <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterFileTypeChange(null)} />
          </Badge>
        )}

        {selectedCount > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium text-primary">
              {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
            </span>
            <Button variant="destructive" size="sm" className="h-7 gap-1" onClick={onDeleteSelected}>
              <Trash2 className="h-3 w-3" />
              Excluir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

